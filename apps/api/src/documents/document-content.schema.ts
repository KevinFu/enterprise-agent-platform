import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DocumentContentDocument = HydratedDocument<DocumentContent>;

/**
 * 文档正文（MongoDB）
 * _id = contentId（雪花ID字符串），与 Postgres kh_document.content_id 关联
 */
@Schema({
  collection: 'document_content',
  _id: false, // 禁用自动 ObjectId，使用自定义字符串 _id
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class DocumentContent {
  /** 主键 = contentId，关联 PG.kh_document.content_id */
  @Prop({ type: String, required: true })
  _id: string;

  /** 文档正文内容 */
  @Prop({ type: String, required: true })
  content: string;

  /** 关联 PG.kh_document.id */
  @Prop({ type: String })
  documentId: string;

  /** 软删除标记 */
  @Prop({ type: Boolean, default: false })
  deleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const DocumentContentSchema =
  SchemaFactory.createForClass(DocumentContent);

DocumentContentSchema.index({ documentId: 1 }, { unique: true });
DocumentContentSchema.index({ deleted: 1 });
