import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateMediaMetadataDto {
  @IsOptional()
  @IsString()
  @MaxLength(250)
  altText?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string | null;
}
