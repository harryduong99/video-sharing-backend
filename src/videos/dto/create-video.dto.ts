import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateVideoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  url: string;
}
