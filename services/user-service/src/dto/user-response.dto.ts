import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 'clxxxxx', description: 'User unique identifier' })
  id: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({ example: 'johndoe', description: 'User username' })
  username: string;

  @ApiProperty({ example: 'John', description: 'User first name' })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'User last name' })
  lastName: string;

  @ApiProperty({ example: 'US', description: 'User country' })
  country: string;

  @ApiProperty({
    example: 'USER',
    description: 'User role',
    enum: ['USER', 'STAFF', 'HIGHER_STAFF', 'OWNER'],
  })
  role: string;

  @ApiProperty({
    example: 'ACTIVE',
    description: 'User status',
    enum: ['ACTIVE', 'INACTIVE', 'BANNED', 'PENDING_VERIFICATION'],
  })
  status: string;

  @ApiProperty({ example: true, description: 'Whether user account is active' })
  isActive: boolean;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Account creation date',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Last update date',
  })
  updatedAt: Date;
  @ApiProperty({
    example: null,
    description: 'Soft deletion date',
    required: false,
  })
  deletedAt?: Date | null;

  @ApiProperty({
    example: null,
    description: 'ID of admin who deleted this user',
    required: false,
  })
  deletedById?: string | null;
  @ApiProperty({
    description: 'Admin who deleted this user',
    required: false,
    nullable: true,
  })
  deletedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
}

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: [UserResponseDto], description: 'Array of users' })
  users: UserResponseDto[];

  @ApiProperty({ example: 100, description: 'Total number of users' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Number of users per page' })
  limit: number;

  @ApiProperty({ example: 10, description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ example: true, description: 'Whether there is a next page' })
  hasNext: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether there is a previous page',
  })
  hasPrev: boolean;
}
