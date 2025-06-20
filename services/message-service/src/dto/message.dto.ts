import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsNumber,
  ValidateIf,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
  IsArray,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

// Custom validator to ensure either content or attachments is provided
function IsContentOrAttachments(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isContentOrAttachments",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          return (
            (obj.content && obj.content.trim()) ||
            (obj.attachments && obj.attachments.length > 0)
          );
        },
        defaultMessage(args: ValidationArguments) {
          return "Either content or attachments must be provided";
        },
      },
    });
  };
}

export class MessageAttachmentDto {
  @ApiProperty({
    description: "URL of uploaded file",
    example: "/uploads/messages/1703123456789-987654321.jpg",
  })
  @IsString()
  @ValidateIf((o) => !o.metadata || o.metadata.type !== "product-cover")
  @IsNotEmpty()
  fileUrl: string;

  @ApiProperty({
    description: "Original file name",
    example: "product-photo.jpg",
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    description: "MIME type of the file",
    example: "image/jpeg",
  })
  @IsString()
  @IsNotEmpty()
  fileType: string;

  @ApiProperty({
    description: "File size in bytes",
    example: 245760,
  })
  @IsNumber()
  fileSize: number;

  @ApiPropertyOptional({
    description: "Additional metadata for special attachment types",
    example: {
      type: "product-cover",
      productId: "clx1y2z3a4b5c6d7e8f9g0h1",
      title: "iPhone 15 Pro Max",
      price: 1200,
      currency: "USD",
      imageUrl: "/uploads/products/iphone-15.jpg",
      username: "seller123",
      location: "New York",
      slug: "iphone-15-pro-max",
    },
  })
  @IsOptional()
  metadata?: {
    type: string;
    productId?: string;
    title?: string;
    price?: number;
    currency?: string;
    imageUrl?: string | null;
    username?: string;
    location?: string;
    slug?: string;
  };
}

export class CreateMessageDto {
  @ApiProperty({
    description: "Message content (optional if attachments are provided)",
    example: "Hello! Is this product still available?",
    required: false,
  })
  @ValidateIf((o) => !o.attachments || o.attachments.length === 0) // Only validate content if no attachments
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @IsContentOrAttachments()
  content?: string;

  @ApiProperty({
    description: "Conversation ID where to send the message",
    example: "clx1y2z3a4b5c6d7e8f9g0h1",
  })
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @ApiPropertyOptional({
    description: "File attachments (max 10)",
    type: [MessageAttachmentDto],
    maxItems: 10,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MessageAttachmentDto)
  attachments?: MessageAttachmentDto[];
}

export class MessageResponseDto {
  @ApiProperty({
    description: "Unique message ID",
    example: "clx1y2z3a4b5c6d7e8f9g0h2",
  })
  id: string;

  @ApiProperty({
    description: "Message content",
    example: "Hello! Is this product still available?",
    required: false,
  })
  content?: string;

  @ApiProperty({
    description: "Sender user ID",
    example: "clx1y2z3a4b5c6d7e8f9g0h3",
  })
  senderId: string;

  @ApiProperty({
    description: "Conversation ID",
    example: "clx1y2z3a4b5c6d7e8f9g0h1",
  })
  conversationId: string;

  @ApiPropertyOptional({
    description: "File attachments",
    type: [MessageAttachmentDto],
  })
  attachments?: MessageAttachmentDto[];

  @ApiProperty({
    description: "Whether the message has been read",
    example: false,
  })
  read: boolean;

  @ApiProperty({
    description: "Message creation date",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Sender information",
    type: "object",
    properties: {
      id: { type: "string" },
      username: { type: "string" },
      firstName: { type: "string" },
      lastName: { type: "string" },
    },
  })
  sender: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
}

export class MarkAsReadDto {
  @ApiProperty({
    description: "Whether to mark as read or unread",
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  read?: boolean = true;
}
