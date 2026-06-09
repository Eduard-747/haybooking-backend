import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import type { AuthRequest } from './interfaces/auth-request.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  @Post('signup')
  async signup(@Body() signupDto: any) {
    return this.authService.signup(signupDto);
  }

  @Post('login')
  async login(@Body() loginDto: any) {
    return this.authService.login(loginDto);
  }

  @Post('send-sms')
  async sendSms(@Body() body: { phoneNumber: string }) {
    return this.authService.sendSms(body);
  }

  @Post('verify-sms')
  async verifySms(@Body() verifyDto: any) {
    return this.authService.verifySms(verifyDto);
  }

  @UseGuards(ThrottlerGuard)
  @Post('forgot-password')
  async forgotPassword(@Body() body: { phoneNumber: string }) {
    return this.authService.forgotPassword(body.phoneNumber);
  }

  @UseGuards(ThrottlerGuard)
  @Post('reset-password')
  async resetPassword(@Body() body: any) {
    return this.authService.resetPassword(
      body.phoneNumber,
      body.code,
      body.password,
    );
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req: AuthRequest) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: AuthRequest, @Res() res: any) {
    const { access_token } = await this.authService.googleLogin(req);
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${access_token}`);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'client', 'partner')
  @Get('profile')
  async getProfile(@Req() req: AuthRequest) {
    // Fetch full user from DB so we return name, surname, email
    const user = await this.userModel
      .findById(req.user.userId)
      .select('-passwordHash')
      .exec();
    return user || req.user;
  }
}
