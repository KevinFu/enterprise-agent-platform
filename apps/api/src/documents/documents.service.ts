import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
  ) {}

  async create(createDocumentDto: CreateDocumentDto): Promise<Document> {
    const document = this.documentRepository.create({
      ...createDocumentDto,
      id: this.generateId(),
      publishTime: createDocumentDto.publishTime
        ? new Date(createDocumentDto.publishTime)
        : null,
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

  /**
   * 生成简单的数字 ID（时间戳 + 随机数）。
   * 表 kh_document.id 是 BIGINT 主键，无自增序列，故在应用层生成。
   */
  private generateId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${timestamp}${random}`;
  }
}
