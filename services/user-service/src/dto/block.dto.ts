import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateBlockDto {
  @ApiPropertyOptional({
    description: 'Username of the user to block',
    example: 'john_doe',
  })
  @IsOptional()
  @IsString()
  blockedUsername?: string;

  @ApiPropertyOptional({
    description: 'User ID of the user to block',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  @IsOptional()
  @IsString()
  blockedId?: string;
}

export class BlockResponseDto {
  @ApiProperty({
    description: 'Block ID',
    example: 'clx1y2z3a4b5c6d7e8f9g0h1',
  })
  id: string;

  @ApiProperty({
    description: 'ID of the user who created the block',
    example: 'clx1y2z3a4b5c6d7e8f9g0h2',
  })
  blockerId: string;

  @ApiProperty({
    description: 'ID of the blocked user',
    example: 'clx1y2z3a4b5c6d7e8f9g0h3',
  })
  blockedId: string;

  @ApiProperty({
    description: 'Information about the blocked user',
  })
  blocked: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };

  @ApiProperty({
    description: 'When the block was created',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;
}

export class BlockListResponseDto {
  @ApiProperty({
    description: 'List of blocked users',
    type: [BlockResponseDto],
  })
  blocks: BlockResponseDto[];

  @ApiProperty({
    description: 'Total number of blocked users',
    example: 5,
  })
  total: number;
}
