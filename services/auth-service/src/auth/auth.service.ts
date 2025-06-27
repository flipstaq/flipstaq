import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { SignupDto, UserRole } from '../dto/signup.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto, UserInfoDto } from '../dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}
  async signup(signupDto: SignupDto): Promise<AuthResponseDto> {
    const {
      firstName,
      lastName,
      email,
      username,
      password,
      dateOfBirth,
      country,
      role = UserRole.USER,
    } = signupDto;

    // Validate age (minimum 13 years)
    const age = this.calculateAge(new Date(dateOfBirth));
    if (age < 13) {
      throw new BadRequestException('User must be at least 13 years old');
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email already exists');
      }
      if (existingUser.username === username) {
        throw new ConflictException('Username already exists');
      }
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate verification token
    const verificationToken = randomUUID();
    const tokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

    // Create user with email verification fields
    const user = await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        username,
        password: hashedPassword,
        dateOfBirth: new Date(dateOfBirth),
        country,
        role,
        emailVerified: false,
        verificationToken,
        tokenExpiresAt,
      },
    }); // Send verification email
    try {
      await this.emailService.sendVerificationEmail(email, firstName, verificationToken, country);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't fail signup if email fails, but log the error
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: this.mapToUserInfo(user),
    };
  }
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { identifier, password } = loginDto;

    // Find user by email or username (include deleted users to check their status)
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user account is deleted
    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Your account has been deleted and access is denied.');
    } // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    // Update user status to online and lastSeen
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isOnline: true,
        lastSeen: new Date(),
      },
    });

    return {
      ...tokens,
      user: this.mapToUserInfo(user),
    };
  }
  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user account is deleted
    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Your account has been deleted. You have been logged out.');
    }

    return this.mapToUserInfo(user);
  }
  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.prisma.refreshToken.delete({
        where: { token: refreshToken },
      });
    } else {
      // Remove all refresh tokens for the user
      await this.prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }

    // Set user as offline and update lastSeen
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isOnline: false,
        lastSeen: new Date(),
      },
    });
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponseDto> {
    // Verify refresh token
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch (error) {
      this.logger.warn(`Invalid refresh token verification attempt: ${error.message}`);
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if refresh token exists in database
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || !storedToken.user) {
      this.logger.warn(`Refresh token not found in database or user not found`);
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      this.logger.warn(`Expired refresh token used for user: ${storedToken.userId}`);
      // Clean up expired token
      await this.prisma.refreshToken.delete({
        where: { token: refreshToken },
      });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role,
    );

    // Replace old refresh token with new one
    await this.prisma.refreshToken.delete({
      where: { token: refreshToken },
    });
    await this.storeRefreshToken(storedToken.userId, tokens.refreshToken);

    this.logger.log(`Tokens refreshed successfully for user: ${storedToken.userId}`);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        username: storedToken.user.username,
        firstName: storedToken.user.firstName,
        lastName: storedToken.user.lastName,
        role: storedToken.user.role,
        country: storedToken.user.country,
        createdAt: storedToken.user.createdAt,
        emailVerified: storedToken.user.emailVerified || false,
      },
    };
  }

  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { verificationToken: token },
    });

    if (!user) {
      return { success: false, message: 'Invalid verification token' };
    }

    if (!user.tokenExpiresAt || user.tokenExpiresAt < new Date()) {
      return { success: false, message: 'Verification token has expired' };
    }

    if (user.emailVerified) {
      return { success: true, message: 'Email already verified' };
    }

    // Update user to mark email as verified and clear verification token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        tokenExpiresAt: null,
      },
    });

    return { success: true, message: 'Email verified successfully' };
  }

  async resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (user.emailVerified) {
      return { success: false, message: 'Email already verified' };
    }

    // Generate new verification token
    const verificationToken = randomUUID();
    const tokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

    // Update user with new token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        tokenExpiresAt,
      },
    }); // Send verification email
    try {
      await this.emailService.sendVerificationEmail(
        email,
        user.firstName,
        verificationToken,
        user.country,
      );
      return { success: true, message: 'Verification email sent successfully' };
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return { success: false, message: 'Failed to send verification email' };
    }
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: UserRole,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRY', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRY', '30d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }
  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now for persistent login

    // Delete old refresh tokens for this user to avoid duplicates
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    // Create new refresh token
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }

    return age;
  }
  private mapToUserInfo(user: any): UserInfoDto {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      country: user.country,
      emailVerified: user.emailVerified || false,
      createdAt: user.createdAt,
    };
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success for security (don't leak if email exists)
    // But only send email if user exists
    if (user) {
      // Generate secure reset token
      const resetToken = randomUUID();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      // Save token to database
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetTokenExpiresAt: expiresAt,
        },
      });

      // Send password reset email
      try {
        await this.emailService.sendPasswordResetEmail(
          email,
          user.firstName,
          resetToken,
          user.country,
        );
        console.log(`Password reset email sent to: ${email}`);
      } catch (error) {
        console.error('Failed to send password reset email:', error);
        // Don't reveal email sending failure for security
      }
    }

    // Always return the same success response
    return {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async validateResetToken(token: string): Promise<{ valid: boolean; message: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
      },
      select: {
        id: true,
        resetTokenExpiresAt: true,
      },
    });

    if (!user || !user.resetTokenExpiresAt) {
      return {
        valid: false,
        message: 'Invalid or expired reset token',
      };
    }

    // Check if token has expired
    if (new Date() > user.resetTokenExpiresAt) {
      // Clean up expired token
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: null,
          resetTokenExpiresAt: null,
        },
      });

      return {
        valid: false,
        message: 'Reset token has expired',
      };
    }

    // Token is valid
    return {
      valid: true,
      message: 'Token is valid',
    };
  }

  async resetPassword(
    token: string,
    password: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
      },
      select: {
        id: true,
        email: true,
        resetTokenExpiresAt: true,
      },
    });

    if (!user || !user.resetTokenExpiresAt) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token has expired
    if (new Date() > user.resetTokenExpiresAt) {
      // Clean up expired token
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: null,
          resetTokenExpiresAt: null,
        },
      });

      throw new BadRequestException('Reset token has expired');
    }

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user password and clear reset token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetTokenExpiresAt: null,
        updatedAt: new Date(),
      },
    });

    console.log(`Password reset successful for user: ${user.email}`);

    return {
      success: true,
      message: 'Password has been reset successfully',
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    // Find the user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Hash the new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date(),
      },
    });

    console.log(`Password changed successfully for user: ${user.email}`);

    return {
      success: true,
      message: 'Password has been changed successfully',
    };
  }
}
