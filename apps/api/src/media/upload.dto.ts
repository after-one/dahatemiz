import { MediaType } from '@dahamiz/shared-types';
import { IsEnum, IsInt, IsString, Max, Min } from 'class-validator';

export class CreateUploadDto {
  @IsEnum(MediaType)
  mediaType!: MediaType;

  @IsInt()
  @Min(1)
  @Max(75 * 1024 * 1024)
  fileSizeBytes!: number;

  @IsString()
  mimeType!: string;
}
