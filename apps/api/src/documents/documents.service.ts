import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import SnowflakeId from 'snowflake-id';
import { Document } from './document.entity';
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
  ) {}

  async create(createDocumentDto: CreateDocumentDto): Promise<Document> {
    const document = this.documentRepository.create({
      ...createDocumentDto,
      id: snowflake.generate(),
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
}
