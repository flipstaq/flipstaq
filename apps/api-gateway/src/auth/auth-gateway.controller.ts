import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Delete,
  Param,
  Headers,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from "@nestjs/common";
import { Request, Response } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { ProxyService } from "../proxy/proxy.service";

@ApiTags("Authentication")
@Controller("auth")
export class AuthGatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  @Post("signup")
  @ApiOperation({ summary: "User signup" })
  @ApiResponse({ status: 201, description: "User successfully registered" })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  async signup(@Body() signupData: any) {
    const response = await this.proxyService.forwardAuthRequest(
      "signup",
      "POST",
      signupData
    );
    return response.data;
  }

  @Post("login")
  @ApiOperation({ summary: "User login" })
  @ApiResponse({ status: 200, description: "User successfully logged in" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(@Body() loginData: any) {
    const response = await this.proxyService.forwardAuthRequest(
      "login",
      "POST",
      loginData
    );
    return response.data;
  }

  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user information" })
  @ApiResponse({ status: 200, description: "Returns current user information" })
  @ApiResponse({ status: 401, description: "Invalid token" })
  async getCurrentUser(@Headers("authorization") authorization: string) {
    const response = await this.proxyService.forwardAuthRequest(
      "me",
      "GET",
      null,
      { authorization }
    );
    return response.data;
  }
  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "User logout" })
  @ApiResponse({ status: 204, description: "User successfully logged out" })
  async logout(@Headers("authorization") authorization: string) {
    const response = await this.proxyService.forwardAuthRequest(
      "logout",
      "POST",
      null,
      { authorization }
    );
    // For 204 No Content responses, don't return data
    if (response.status === 204) {
      return;
    }
    return response.data;
  }
  @Post("validate")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Validate JWT token" })
  @ApiResponse({ status: 200, description: "Token is valid" })
  @ApiResponse({ status: 401, description: "Invalid token" })
  async validateToken(@Headers("authorization") authorization: string) {
    const response = await this.proxyService.forwardAuthRequest(
      "validate",
      "POST",
      null,
      { authorization }
    );
    return response.data;
  }

  @Post("refresh")
  @ApiOperation({ summary: "Refresh JWT token" })
  @ApiResponse({ status: 200, description: "Token refreshed successfully" })
  @ApiResponse({ status: 401, description: "Invalid refresh token" })
  async refreshToken(
    @Body() refreshData: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const response = await this.proxyService.forwardAuthRequest(
      "refresh",
      "POST",
      refreshData,
      {
        cookie: req.headers.cookie || "", // Forward cookies
      },
      res
    );
    return response.data;
  }

  @Post("forgot-password")
  @ApiOperation({ summary: "Request password reset" })
  @ApiResponse({ status: 200, description: "Password reset email sent" })
  async forgotPassword(@Body() forgotPasswordData: any) {
    const response = await this.proxyService.forwardAuthRequest(
      "forgot-password",
      "POST",
      forgotPasswordData
    );
    return response.data;
  }

  @Post("reset-password")
  @ApiOperation({ summary: "Reset password with token" })
  @ApiResponse({ status: 200, description: "Password reset successfully" })
  async resetPassword(@Body() resetPasswordData: any) {
    const response = await this.proxyService.forwardAuthRequest(
      "reset-password",
      "POST",
      resetPasswordData
    );
    return response.data;
  }

  @Post("validate-reset-token")
  @ApiOperation({ summary: "Validate password reset token" })
  @ApiResponse({ status: 200, description: "Token validation result" })
  async validateResetToken(@Body() tokenData: any) {
    const response = await this.proxyService.forwardAuthRequest(
      "validate-reset-token",
      "POST",
      tokenData
    );
    return response.data;
  }

  @Post("change-password")
  @ApiOperation({ summary: "Change user password" })
  @ApiResponse({ status: 200, description: "Password changed successfully" })
  @ApiBearerAuth()
  async changePassword(
    @Body() changePasswordData: any,
    @Headers("authorization") authorization: string
  ) {
    const response = await this.proxyService.forwardAuthRequest(
      "change-password",
      "POST",
      changePasswordData,
      { Authorization: authorization }
    );
    return response.data;
  }

  @Get("verify-email")
  @ApiOperation({ summary: "Verify user email with token" })
  @ApiResponse({ status: 200, description: "Email verification result" })
  async verifyEmail(@Query("token") token: string) {
    const response = await this.proxyService.forwardAuthRequest(
      `verify-email?token=${token}`,
      "GET"
    );
    return response.data;
  }

  @Post("resend-verification")
  @ApiOperation({ summary: "Resend email verification" })
  @ApiResponse({ status: 200, description: "Verification email resend result" })
  async resendVerificationEmail(@Body() body: { email: string }) {
    const response = await this.proxyService.forwardAuthRequest(
      "resend-verification",
      "POST",
      body
    );
    return response.data;
  }
}
