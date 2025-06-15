import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetUsersQueryDto, UserRole, UserStatus } from '../dto/get-users-query.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto, PaginatedUsersResponseDto } from '../dto/user-response.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(query: GetUsersQueryDto): Promise<PaginatedUsersResponseDto> {
    const {
      role,
      status,
      search,
      createdAfter,
      createdBefore,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeDeleted = false,
      onlyDeleted = false,
    } = query;

    // Build where clause
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (createdAfter || createdBefore) {
      where.createdAt = {};
      if (createdAfter) {
        where.createdAt.gte = new Date(createdAfter);
      }
      if (createdBefore) {
        where.createdAt.lte = new Date(createdBefore);
      }
    } // Handle soft deletion
    if (onlyDeleted) {
      where.deletedAt = { not: null };
    } else if (!includeDeleted) {
      where.deletedAt = null;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await this.prisma.user.count({ where });

    // Get users
    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        country: true,
        role: true,
        status: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      users,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }
  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        country: true,
        role: true,
        status: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        deletedById: true,
        deletedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUser: any,
  ): Promise<UserResponseDto> {
    // Check if user exists
    const existingUser = await this.findOne(id);

    // Prevent users from changing their own role
    if (updateUserDto.role && currentUser.sub === id) {
      throw new ForbiddenException('Cannot modify your own role');
    }

    // Only owners can promote to OWNER role
    if (updateUserDto.role === UserRole.OWNER && currentUser.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only owners can assign owner role');
    }

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        country: true,
        role: true,
        status: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    return updatedUser;
  }
  async softDelete(id: string, currentUser: any): Promise<{ message: string }> {
    console.log('🔥 SoftDelete called with:', { id, currentUser });

    // Prevent users from deleting themselves
    if (currentUser.sub === id) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    // Check if user exists and is not already deleted
    const existingUser = await this.findOne(id);

    // Prepare the update data
    const updateData: any = {
      deletedAt: new Date(),
      isActive: false,
      status: UserStatus.INACTIVE,
    }; // Try to set deletedById if the admin user exists
    if (currentUser?.sub && currentUser.sub !== 'internal-service') {
      console.log('🔍 Looking for admin user with ID:', currentUser.sub);
      console.log('🔍 Current user object:', JSON.stringify(currentUser, null, 2));
      try {
        const adminUser = await this.prisma.user.findUnique({
          where: { id: currentUser.sub },
          select: { id: true, firstName: true, lastName: true, email: true }, // Get more info for debugging
        });

        console.log('👤 Admin user found:', adminUser);
        if (adminUser) {
          updateData.deletedById = currentUser.sub;
          console.log('✅ Setting deletedById to:', currentUser.sub);
        } else {
          console.log('❌ Admin user not found in database');
          // Let's also check if there are any users with similar IDs
          const allUsers = await this.prisma.user.findMany({
            select: { id: true, email: true, firstName: true, lastName: true },
            take: 5, // Just get a few for comparison
          });
          console.log('🔍 Sample users in database:', allUsers);
        }
      } catch (error) {
        console.error('❌ Error finding admin user:', error);
        // Continue without setting deletedById
      }
    } else {
      console.log('⚠️ currentUser object:', JSON.stringify(currentUser, null, 2));
      console.log('⚠️ No valid currentUser.sub or is internal-service');
    }

    console.log('📝 Final update data:', updateData);

    // Soft delete the user
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    console.log('💾 Updated user in DB:', updatedUser);

    return { message: 'User successfully deleted' };
  }

  async restore(id: string): Promise<UserResponseDto> {
    // Find the user even if soft deleted
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.deletedAt) {
      throw new ForbiddenException('User is not deleted');
    } // Restore the user
    const restoredUser = await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedById: null, // Clear who deleted the user
        isActive: true,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        country: true,
        role: true,
        status: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    return restoredUser;
  }
}
