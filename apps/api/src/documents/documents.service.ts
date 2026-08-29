import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import SnowflakeId from 'snowflake-id';
import { Document } from './document.entity';
import {
  DocumentContent,
  DocumentContentDocument,
} from './document-content.schema';
import { CreateDocumentDto } from './dto/create-document.dto';

const snowflake = new SnowflakeId({
  mid: Number(process.env.MACHINE_ID) || 1,
  offset: 1704067200000, // 2024-01-01
});

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectModel(DocumentContent.name)
    private readonly documentContentModel: Model<DocumentContentDocument>,
  ) {}

  async create(createDocumentDto: CreateDocumentDto): Promise<Document> {
    const { content, summary, wordCount, ...pgDto } = createDocumentDto;

    const contentId = pgDto.contentId || snowflake.generate();
    const documentId = snowflake.generate();

    // 1. 先写 MongoDB 正文
    try {
      await this.documentContentModel.create({
        _id: contentId,
        content,
        documentId,
      });
    } catch (err) {
      throw new InternalServerErrorException(
        `保存文档正文到 MongoDB 失败: ${(err as Error).message}`,
      );
    }

    // 2. 自动计算 summary 和 wordCount
    const autoSummary = summary?.trim() || this.extractSummary(content);
    const autoWordCount = wordCount ?? this.calculateWordCount(content);

    // 3. 写 Postgres
    const document = this.documentRepository.create({
      ...pgDto,
      id: documentId,
      contentId,
      summary: autoSummary,
      wordCount: autoWordCount,
      publishTime: pgDto.publishTime ? new Date(pgDto.publishTime) : null,
    });

    return this.documentRepository.save(document);
  }

  async findAll(): Promise<Document[]> {
    return this.documentRepository.find({
      where: { deleted: false },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Document | null> {
    return this.documentRepository.findOne({
      where: { id, deleted: false },
    });
  }

  /** 根据 contentId 获取正文 */
  async getContent(contentId: string): Promise<DocumentContent | null> {
    return this.documentContentModel
      .findOne({ _id: contentId, deleted: false })
      .lean();
  }

  /** 截取前 200 字作为 summary */
  private extractSummary(content: string): string {
    const trimmed = content.replace(/\s+/g, ' ').trim();
    if (trimmed.length <= 200) return trimmed;
    return trimmed.slice(0, 200) + '...';
  }

  /** 计算字数：中文按 2，英文/数字按 1 */
  private calculateWordCount(content: string): number {
    let count = 0;
    for (const char of content) {
      // CJK 统一汉字、兼容汉字、扩展 A~F
      if (/[\u3400-\u9FFF\uF900-\uFAFF]/.test(char)) {
        count += 2;
      } else {
        count += 1;
      }
    }
    return count;
  }
}
