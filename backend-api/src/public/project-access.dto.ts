import { IsString, Length } from "class-validator";

export class ProjectAccessDto {
  @IsString()
  @Length(8, 256)
  password!: string;
}
