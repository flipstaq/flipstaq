import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
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
    let payload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if refresh token exists in database
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired or not found');
    }

    // Check if user is still active
    if (!storedToken.user.isActive || storedToken.user.deletedAt) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role,
    );

    // Store new refresh token and remove old one
    await this.storeRefreshToken(storedToken.user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.mapToUserInfo(storedToken.user),
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
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }
  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

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
}
