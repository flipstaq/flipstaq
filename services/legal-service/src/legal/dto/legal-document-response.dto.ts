import { ApiProperty } from "@nestjs/swagger";

export class LegalDocumentResponseDto {
  @ApiProperty({ example: "clh2k3j4h0000qwerty123456" })
  id: string;

  @ApiProperty({ example: "tos" })
  type: string;

  @ApiProperty({ example: "en" })
  language: string;

  @ApiProperty({ example: "Terms of Service" })
  title: string;

  @ApiProperty({ example: "# Terms of Service\n\nWelcome to Flipstaq..." })
  content: string;

  @ApiProperty({ example: 1 })
  version: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: "2025-06-27T10:00:00Z" })
  createdAt: Date;

  @ApiProperty({ example: "2025-06-27T10:00:00Z" })
  updatedAt: Date;

  @ApiProperty({ example: "clh2k3j4h0000admin123456" })
  updatedById: string;

  @ApiProperty({
    example: {
      id: "clh2k3j4h0000admin123456",
      username: "admin",
      firstName: "Admin",
      lastName: "User",
      avatarUrl: "https://example.com/avatar.jpg",
    },
  })
  updatedBy: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
  };
}
