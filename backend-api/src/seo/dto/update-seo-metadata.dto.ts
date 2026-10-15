import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateSeoMetadataDto {
  @IsOptional() @IsString() @MaxLength(70)
  title?: string | null;

  @IsOptional() @IsString() @MaxLength(320)
  description?: string | null;

  @IsOptional() @IsString() @MaxLength(2048)
  canonical?: string | null;

  @IsOptional() @IsString() @MaxLength(70)
  ogTitle?: string | null;

  @IsOptional() @IsString() @MaxLength(320)
  ogDescription?: string | null;

  @IsOptional() @IsString() @MaxLength(2048)
  ogImageUrl?: string | null;

  @IsOptional() @IsBoolean()
  noIndex?: boolean;

  @IsOptional() @IsBoolean()
  noFollow?: boolean;
}
