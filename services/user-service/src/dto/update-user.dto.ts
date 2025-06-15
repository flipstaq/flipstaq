import { IsOptional, IsEnum } from "class-validator";
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

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: "Update user role",
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: "Update user status",
    enum: UserStatus,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
