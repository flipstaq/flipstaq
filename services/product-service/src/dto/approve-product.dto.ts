import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ProductStatus } from '@flipstaq/db';

export class ApproveProductDto {
  @ApiProperty({
    description: 'New product status',
    enum: ProductStatus,
    example: ProductStatus.APPROVED,
  })
  @IsEnum(ProductStatus)
  status: ProductStatus;

  @ApiProperty({
    description: 'Optional reason for rejection',
    example: 'Product does not meet our quality standards',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class ProductApprovalResponseDto {
  @ApiProperty({
    description: 'Updated product status',
    enum: ProductStatus,
  })
  status: ProductStatus;

  @ApiProperty({
    description: 'When the product was approved/rejected',
    example: '2025-06-26T18:51:35.000Z',
  })
  approvedAt?: Date;

  @ApiProperty({
    description: 'ID of the user who approved/rejected the product',
    example: 'cmbzf1a2b0001x8i9uvxyze1k',
  })
  approvedById?: string;

  @ApiProperty({
    description: 'Email sent to product owner',
    example: true,
  })
  emailSent: boolean;

  @ApiProperty({
    description: 'Success message',
    example: 'Product approved successfully',
  })
  message: string;
}
