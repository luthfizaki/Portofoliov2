import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Length, MaxLength } from "class-validator";

const statuses = ["DRAFT", "IN_REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"] as const;
const accents = ["blue", "purple", "green"] as const;

export class TestimonialFieldsDto {
  @IsOptional() @IsString() @MaxLength(140) name?: string;
  @IsOptional() @IsString() @MaxLength(160) role?: string;
  @IsOptional() @IsString() @MaxLength(180) company?: string;
  @IsOptional() @IsString() @MaxLength(900) quote?: string;
  @IsOptional() @IsString() @MaxLength(6) initial?: string;
  @IsOptional() @IsString() @MaxLength(260) avatarUrl?: string;
  @IsOptional() @IsIn(accents) accent?: (typeof accents)[number];
  @IsOptional() @IsString() @MaxLength(80) featuredLabel?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsIn(statuses) status?: (typeof statuses)[number];
  @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
}

export class CreateTestimonialDto extends TestimonialFieldsDto {
  @IsString() @Length(1, 140) declare name: string;
  @IsString() @Length(1, 900) declare quote: string;
}
