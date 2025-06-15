import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { SignupDto } from '../dto/signup.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Internal Auth')
@Controller('internal/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
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
  async signup(@Body() signupDto: SignupDto): Promise<AuthResponseDto> {
    return this.authService.signup(signupDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
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
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiResponse({
    status: 204,
    description: 'User successfully logged out',
  })
  async logout(@Request() req: any): Promise<void> {
    // Try to extract user ID from token if present, but don't require it
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = this.jwtService.verify(token);
        await this.authService.logout(decoded.sub);
      } catch (error) {
        // Token might be expired or invalid, but logout should still succeed
        console.log('Token validation failed during logout, but continuing...');
      }
    }
    // Always return success for logout, even without valid token
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate current user token and get user info' })
  @ApiResponse({
    status: 200,
    description: 'Token is valid, returns user information',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid token',
  })
  async validateToken(@Request() req: any) {
    return this.authService.validateUser(req.user.sub);
  }

  @Post('validate-user')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Internal endpoint to validate user by ID' })
  @ApiResponse({
    status: 200,
    description: 'User is valid and active',
  })
  @ApiResponse({
    status: 401,
    description: 'User is deleted or inactive',
  })
  async validateUserById(@Body() body: { userId: string }) {
    try {
      const user = await this.authService.validateUser(body.userId);
      return { valid: true, user };
    } catch (error) {
      throw error; // This will be caught by the API gateway and converted to 401
    }
  }
}
