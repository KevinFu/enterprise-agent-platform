import {
  Column,
  Entity,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('kh_document')
export class Document {
  @PrimaryColumn({ type: 'bigint', name: 'id' })
  id: string;

  @Column({ type: 'varchar', name: 'title' })
  title: string;

  @Column({ type: 'varchar', name: 'content_id', unique: true })
  contentId: string;

  @Column({ type: 'varchar', name: 'summary', nullable: true })
  summary: string | null;

  @Column({ type: 'bigint', name: 'category_id', nullable: true })
  categoryId: string | null;

  @Column({ type: 'bigint', name: 'team_id', nullable: true })
  teamId: string | null;

  @Column({ type: 'bigint', name: 'author_id', nullable: true })
  authorId: string | null;

  @Column({ type: 'varchar', name: 'cover_image', nullable: true })
  coverImage: string | null;

  @Column({ type: 'varchar', name: 'tags', nullable: true })
  tags: string | null;

  @Column({ type: 'smallint', name: 'status', default: 0 })
  status: number;

  @Column({ type: 'varchar', name: 'remark', nullable: true })
  remark: string | null;

  @Column({ type: 'int', name: 'view_count', default: 0 })
  viewCount: number;

  @Column({ type: 'int', name: 'like_count', default: 0 })
  likeCount: number;

  @Column({ type: 'int', name: 'comment_count', default: 0 })
  commentCount: number;

  @Column({ type: 'int', name: 'favorite_count', default: 0 })
  favoriteCount: number;

  @Column({ type: 'int', name: 'word_count', default: 0 })
  wordCount: number;

  @Column({ type: 'timestamp', name: 'publish_time', nullable: true })
  publishTime: Date | null;

  @Column({ type: 'boolean', name: 'is_public', default: false })
  isPublic: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'bigint', name: 'create_by', nullable: true })
  createBy: string | null;

  @Column({ type: 'bigint', name: 'update_by', nullable: true })
  updateBy: string | null;

  @Column({ type: 'boolean', name: 'deleted', default: false })
  deleted: boolean;
}
