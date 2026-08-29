import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  getDocuments() {
    return this.documentsService.findAll();
  }

  @Get(':id')
  getDocument(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Post()
  createDocument(@Body() createDocumentDto: CreateDocumentDto) {
    return this.documentsService.create(createDocumentDto);
  }
}
