import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Length, MaxLength } from "class-validator";

const statuses = ["DRAFT", "IN_REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"] as const;

export class ExperienceFieldsDto {
  @IsOptional() @IsString() @MaxLength(80) year?: string;
  @IsOptional() @IsString() @MaxLength(140) role?: string;
  @IsOptional() @IsString() @MaxLength(180) company?: string;
  @IsOptional() @IsString() @MaxLength(600) contribution?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsIn(statuses) status?: (typeof statuses)[number];
  @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
}

export class CreateExperienceDto extends ExperienceFieldsDto {
  @IsString() @Length(1, 80) declare year: string;
  @IsString() @Length(1, 140) declare role: string;
  @IsString() @Length(1, 180) declare company: string;
  @IsString() @Length(1, 600) declare contribution: string;
}
