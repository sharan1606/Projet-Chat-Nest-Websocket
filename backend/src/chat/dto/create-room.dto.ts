import { IsString, IsArray, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsArray()
  @IsString({ each: true })
  memberIds: string[];

  @IsOptional()
  @IsBoolean()
  hasHistoryAccess?: boolean;
}
