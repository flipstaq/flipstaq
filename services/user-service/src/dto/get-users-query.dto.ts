import {
  IsOptional,
  IsEnum,
  IsString,
  IsDateString,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

export enum UserRole {
  OWNER = "OWNER",
  HIGHER_STAFF = "HIGHER_STAFF",
  STAFF = "STAFF",
  USER = "USER",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BANNED = "BANNED",
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
}

export class GetUsersQueryDto {
  @ApiPropertyOptional({
    description: "Filter users by role",
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: "Filter users by status",
    enum: UserStatus,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: "Search by username or email",
    example: "john",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Filter users created after this date",
    example: "2024-01-01",
  })
  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @ApiPropertyOptional({
    description: "Filter users created before this date",
    example: "2024-12-31",
  })
  @IsOptional()
  @IsDateString()
  createdBefore?: string;

  @ApiPropertyOptional({
    description: "Page number for pagination",
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Number of users per page",
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: "Sort field",
    example: "createdAt",
    enum: [
      "createdAt",
      "updatedAt",
      "firstName",
      "lastName",
      "email",
      "username",
    ],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = "createdAt";

  @ApiPropertyOptional({
    description: "Sort order",
    example: "desc",
    enum: ["asc", "desc"],
  })
  @IsOptional()
  @IsString()
  sortOrder?: "asc" | "desc" = "desc";

  @ApiPropertyOptional({
    description: "Include soft-deleted users",
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  includeDeleted?: boolean = false;

  @ApiPropertyOptional({
    description: "Only show deleted users",
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  onlyDeleted?: boolean = false;
}
