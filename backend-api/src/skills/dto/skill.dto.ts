import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from "class-validator";

const statuses = ["DRAFT", "IN_REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"] as const;

export class SkillFieldsDto {
  @IsOptional() @IsString() @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MaxLength(120) category?: string;
  @IsOptional() @IsString() @MaxLength(520) description?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) level?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) tools?: string[];
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsIn(statuses) status?: (typeof statuses)[number];
  @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
}

export class CreateSkillDto extends SkillFieldsDto {
  @IsString() @Length(1, 120) declare name: string;
  @IsString() @Length(1, 120) declare category: string;
  @IsString() @Length(1, 520) declare description: string;
}
