import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsEnum,
  IsString,
  IsBoolean,
  IsEmail,
  MinLength,
} from "class-validator";
import { UserRole, UserStatus } from "./get-users-query.dto";

export class UpdateUserDto {
  @ApiPropertyOptional({ description: "User's first name" })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: "User's last name" })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: "User's email address" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: "Username (minimum 2 characters)" })
  @IsOptional()
  @IsString()
  @MinLength(2)
  username?: string;

  @ApiPropertyOptional({ description: "ISO country code" })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ enum: UserRole, description: "User role" })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ enum: UserStatus, description: "User status" })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ description: "Account active status" })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
