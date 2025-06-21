import {
  IsString,
  IsEnum,
  IsOptional,
  MaxLength,
  IsNotEmpty,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ReportType } from "@flipstaq/db";

export class CreateReportDto {
  @ApiProperty({ enum: ReportType, description: "Type of report" })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty({
    description: "Target user ID (for USER reports)",
    required: false,
  })
  @IsOptional()
  @IsString()
  targetUserId?: string;

  @ApiProperty({
    description: "Target product ID (for PRODUCT reports)",
    required: false,
  })
  @IsOptional()
  @IsString()
  targetProductId?: string;

  @ApiProperty({
    description: "Target message ID (for MESSAGE reports)",
    required: false,
  })
  @IsOptional()
  @IsString()
  targetMessageId?: string;

  @ApiProperty({ description: "Reason for the report" })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({
    description: "Additional comment",
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}

export class ReportResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reporterId: string;

  @ApiProperty({ enum: ReportType })
  type: ReportType;

  @ApiProperty({ required: false })
  targetUserId?: string;

  @ApiProperty({ required: false })
  targetProductId?: string;

  @ApiProperty({ required: false })
  targetMessageId?: string;

  @ApiProperty()
  reason: string;

  @ApiProperty({ required: false })
  comment?: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  resolvedAt?: Date;

  @ApiProperty({ required: false })
  resolvedById?: string;

  // Additional data for admin view
  @ApiProperty({ required: false })
  targetData?: {
    username?: string;
    productTitle?: string;
    messageContent?: string;
  };

  @ApiProperty({ required: false })
  reporterData?: {
    username: string;
    email: string;
  };
}
