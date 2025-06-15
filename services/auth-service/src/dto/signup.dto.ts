import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, IsDateString, IsEnum, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole as PrismaUserRole } from '@flipstaq/db';

// Export Prisma UserRole for use in other files
export { UserRole } from '@flipstaq/db';

export class SignupDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Username (minimum 2 characters)',
    example: 'johndoe',
  })
  @IsString()
  @MinLength(2)
  username: string;

  @ApiProperty({
    description: 'Password (minimum 8 characters)',
    example: 'SecurePassword123!',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'Date of birth (ISO date string)',
    example: '1990-01-15',
  })
  @IsDateString()
  @Transform(({ value }) => new Date(value).toISOString())
  dateOfBirth: string;

  @ApiProperty({
    description: 'Country code',
    example: 'US',
  })
  @IsString()
  @IsNotEmpty()
  country: string;
  @ApiProperty({
    description: 'User role',
    enum: PrismaUserRole,
    default: PrismaUserRole.USER,
  })
  @IsEnum(PrismaUserRole)
  role?: PrismaUserRole = PrismaUserRole.USER;
}
