import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateConversationDto {
  @ApiProperty({
    description: "Username of the user to start conversation with (with @)",
    example: "@johndoe",
  })
  @IsString()
  @IsNotEmpty()
  username: string;
}

export class ConversationResponseDto {
  @ApiProperty({
    description: "Unique conversation ID",
    example: "clx1y2z3a4b5c6d7e8f9g0h1",
  })
  id: string;
  @ApiProperty({
    description: "List of participant user information",
    type: "array",
    items: {
      type: "object",
      properties: {
        id: { type: "string" },
        username: { type: "string" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        isOnline: { type: "boolean" },
        lastSeen: { type: "string", format: "date-time" },
      },
    },
  })
  participants: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    isOnline: boolean;
    lastSeen?: Date;
  }[];

  @ApiProperty({
    description: "Last message in the conversation",
    required: false,
  })
  @IsOptional()
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
    read: boolean;
  };

  @ApiProperty({
    description: "Number of unread messages for the current user",
  })
  unreadCount: number;

  @ApiProperty({
    description: "Conversation creation date",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Conversation last update date",
  })
  updatedAt: Date;
}
