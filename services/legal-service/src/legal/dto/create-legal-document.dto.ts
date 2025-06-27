import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateLegalDocumentDto {
  @ApiProperty({
    description: "Document type (e.g., tos, privacy, cookie_policy)",
    example: "tos",
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: "Language code (e.g., en, ar)",
    example: "en",
  })
  @IsString()
  @IsNotEmpty()
  language: string;

  @ApiProperty({
    description: "Document title",
    example: "Terms of Service",
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: "Document content in markdown or HTML",
    example: "# Terms of Service\n\nWelcome to Flipstaq...",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  content: string;

  @ApiPropertyOptional({
    description: "Whether this version should be active",
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
