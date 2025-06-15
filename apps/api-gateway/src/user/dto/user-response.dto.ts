import { ApiProperty } from "@nestjs/swagger";
import { UserRole, UserStatus } from "./get-users-query.dto";

export class UserResponseDto {
  @ApiProperty({ description: "User ID" })
  id: string;

  @ApiProperty({ description: "Email address" })
  email: string;

  @ApiProperty({ description: "Username" })
  username: string;

  @ApiProperty({ description: "First name" })
  firstName: string;

  @ApiProperty({ description: "Last name" })
  lastName: string;

  @ApiProperty({ description: "Date of birth" })
  dateOfBirth: Date;

  @ApiProperty({ description: "Country" })
  country: string;

  @ApiProperty({ enum: UserRole, description: "User role" })
  role: UserRole;

  @ApiProperty({ enum: UserStatus, description: "User status" })
  status: UserStatus;

  @ApiProperty({ description: "Account active status" })
  isActive: boolean;

  @ApiProperty({ description: "Creation timestamp" })
  createdAt: Date;

  @ApiProperty({ description: "Last update timestamp" })
  updatedAt: Date;
  @ApiProperty({ description: "Soft deletion timestamp", nullable: true })
  deletedAt: Date | null;

  @ApiProperty({
    description: "ID of admin who deleted this user",
    nullable: true,
  })
  deletedById?: string | null;

  @ApiProperty({
    description: "Admin who deleted this user",
    nullable: true,
    required: false,
  })
  deletedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
}

export class PaginationDto {
  @ApiProperty({ description: "Current page number" })
  page: number;

  @ApiProperty({ description: "Number of items per page" })
  limit: number;

  @ApiProperty({ description: "Total number of items" })
  total: number;

  @ApiProperty({ description: "Total number of pages" })
  pages: number;
}

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: [UserResponseDto], description: "Array of users" })
  data: UserResponseDto[];

  @ApiProperty({ type: PaginationDto, description: "Pagination information" })
  pagination: PaginationDto;
}
