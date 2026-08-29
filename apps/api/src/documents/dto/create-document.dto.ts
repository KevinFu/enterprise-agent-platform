import {
  IsString,
  IsBoolean,
  IsOptional,
  IsDateString,
  IsInt,
  MinLength,
} from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  contentId: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsString()
  authorId?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @IsInt()
  status?: number;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsInt()
  wordCount?: number;

  @IsOptional()
  @IsDateString()
  publishTime?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsString()
  createBy?: string;
}
