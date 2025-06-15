import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsEnum,
  IsString,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";

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
    description: "Page number for pagination",
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Number of users per page",
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: UserRole, description: "Filter by user role" })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    enum: UserStatus,
    description: "Filter by user status",
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: "Search in firstName, lastName, email, username",
  })
  @IsOptional()
  @IsString()
  search?: string;
  @ApiPropertyOptional({
    description: "Include soft-deleted users",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeDeleted?: boolean = false;

  @ApiPropertyOptional({
    description: "Return only soft-deleted users",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  onlyDeleted?: boolean = false;
}
