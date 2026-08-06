import { IsBoolean, IsObject } from "class-validator";

export class UpdatePageSectionDto {
  @IsObject()
  content!: Record<string, unknown>;
}

export class UpdatePageSectionVisibilityDto {
  @IsBoolean()
  isVisible!: boolean;
}
