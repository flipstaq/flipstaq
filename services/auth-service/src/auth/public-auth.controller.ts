import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
  Logger,
  Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SignupDto } from '../dto/signup.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto, UserInfoDto } from '../dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
@SkipThrottle() // Skip throttling for most auth endpoints by default
export class PublicAuthController {
  private readonly logger = new Logger(PublicAuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 requests per 5 minutes for signup endpoint
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiBody({ type: SignupDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or age restriction',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - email or username already exists',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many registration attempts. Please wait and try again.',
  })
  async signup(@Body() signupDto: SignupDto, @Ip() ip: string): Promise<AuthResponseDto> {
    try {
      this.logger.log(`Signup attempt for ${signupDto.email} from IP: ${ip}`);
      const result = await this.authService.signup(signupDto);
      this.logger.log(`Successful signup for ${signupDto.email} from IP: ${ip}`);
      return result;
    } catch (error) {
      this.logger.warn(
        `Failed signup attempt for ${signupDto.email} from IP: ${ip} - ${error.message}`,
      );
      throw error;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 requests per 5 minutes for login endpoint
  @ApiOperation({ summary: 'Login with email/username and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid credentials',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many login attempts. Please wait and try again.',
  })
  async login(@Body() loginDto: LoginDto, @Ip() ip: string): Promise<AuthResponseDto> {
    try {
      this.logger.log(`Login attempt for ${loginDto.identifier} from IP: ${ip}`);
      const result = await this.authService.login(loginDto);
      this.logger.log(`Successful login for ${loginDto.identifier} from IP: ${ip}`);
      return result;
    } catch (error) {
      this.logger.warn(
        `Failed login attempt for ${loginDto.identifier} from IP: ${ip} - ${error.message}`,
      );
      throw error;
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({
    status: 200,
    description: 'Returns current user information',
    type: UserInfoDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid token',
  })
  async getCurrentUser(@Request() req: any): Promise<UserInfoDto> {
    return this.authService.validateUser(req.user.sub);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiResponse({
    status: 204,
    description: 'User successfully logged out',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid token',
  })
  async logout(@Request() req: any): Promise<void> {
    await this.authService.logout(req.user.sub);
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate current user token and get user info' })
  @ApiResponse({
    status: 200,
    description: 'Token is valid, returns user information',
    type: UserInfoDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid token',
  })
  async validateToken(@Request() req: any): Promise<UserInfoDto> {
    return this.authService.validateUser(req.user.sub);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute for refresh endpoint
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid refresh token',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many token refresh attempts. Please wait and try again.',
  })
  async refreshToken(
    @Body() body: { refreshToken: string },
    @Ip() ip: string,
  ): Promise<AuthResponseDto> {
    try {
      this.logger.log(`Token refresh attempt from IP: ${ip}`);
      const result = await this.authService.refreshTokens(body.refreshToken);
      this.logger.log(`Successful token refresh from IP: ${ip}`);
      return result;
    } catch (error) {
      this.logger.warn(`Failed token refresh attempt from IP: ${ip} - ${error.message}`);
      throw error;
    }
  }
}
