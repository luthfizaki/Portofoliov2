import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsObject, IsOptional, IsString, Length, MaxLength, ValidateNested } from "class-validator";

const statuses = ["DRAFT", "IN_REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"] as const;
const visibilities = ["PUBLIC", "UNLISTED", "PASSWORD_PROTECTED", "PRIVATE"] as const;

export class ProjectFieldsDto {
  @IsOptional() @IsString() @MaxLength(180) title?: string;
  @IsOptional() @IsString() @MaxLength(180) slug?: string;
  @IsOptional() @IsString() @MaxLength(500) excerpt?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() @MaxLength(160) client?: string;
  @IsOptional() @IsString() @MaxLength(120) industry?: string;
  @IsOptional() @Type(() => Number) @IsInt() year?: number;
  @IsOptional() @IsString() @MaxLength(160) role?: string;
  @IsOptional() @IsString() @MaxLength(120) duration?: string;
  @IsOptional() @IsString() @MaxLength(120) platform?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) services?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) tools?: string[];
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsBoolean() nda?: boolean;
  @IsOptional() @IsIn(visibilities) visibility?: (typeof visibilities)[number];
  @IsOptional() @IsIn(statuses) status?: (typeof statuses)[number];
  @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
  /** Optional optimistic-lock value captured when the CMS editor loaded the project. */
  @IsOptional() @IsDateString() expectedUpdatedAt?: string;
  /** Additive combined-save payload. Omission preserves metadata-only behavior. */
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ProjectBlockDto) blocks?: ProjectBlockDto[];
}

export class CreateProjectDto extends ProjectFieldsDto {
  @IsString() @Length(1, 180) declare title: string;
}

export class ProjectBlockDto {
  @IsString() @MaxLength(80) type!: string;
  @IsOptional() @IsString() @MaxLength(180) title?: string;
  @IsObject() content!: Record<string, unknown>;
  @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
  @IsOptional() @IsBoolean() isVisible?: boolean;
  @IsOptional() @IsString() layoutVariant?: string;
  @IsOptional() @IsBoolean() desktop?: boolean;
  @IsOptional() @IsBoolean() tablet?: boolean;
  @IsOptional() @IsBoolean() mobile?: boolean;
  @IsOptional() @IsString() background?: string;
  @IsOptional() @IsString() animation?: string;
  /** Only CASE_FEATURE supports explicit deletion; omission always preserves it. */
  @IsOptional() @IsBoolean() delete?: boolean;
}

export class ReplaceProjectBlocksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectBlockDto)
  blocks!: ProjectBlockDto[];
}
