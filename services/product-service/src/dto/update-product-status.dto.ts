import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateProductStatusDto {
  @ApiProperty({
    description: 'Whether the product is sold or not',
    example: true,
  })
  @IsBoolean()
  isSold: boolean;
}
