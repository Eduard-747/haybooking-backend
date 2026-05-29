import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from './schemas/user.schema';
import type { AuthRequest } from '../auth/interfaces/auth-request.interface';

@Controller('users')
export class UsersController {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  // GET /users/me — return current user profile
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: AuthRequest) {
    return this.userModel
      .findById(req.user.userId)
      .select('-passwordHash')
      .exec();
  }

  // PUT /users/me — update current user profile
  @UseGuards(JwtAuthGuard)
  @Put('me')
  async updateMe(@Req() req: AuthRequest, @Body() updateData: any) {
    // Don't allow role, password, or phone changes via this generic endpoint
    const {
      role: _r,
      passwordHash: _p,
      phoneNumber: _pn,
      ...safeData
    } = updateData;
    return this.userModel
      .findByIdAndUpdate(req.user.userId, safeData, { new: true })
      .select('-passwordHash')
      .exec();
  }

  // PUT /users/me/phone — verify and update phone number
  @UseGuards(JwtAuthGuard)
  @Put('me/phone')
  async updatePhone(
    @Req() req: AuthRequest,
    @Body() body: { phoneNumber: string; code: string },
  ) {
    const { phoneNumber, code } = body;
    if (!phoneNumber || !code || code.length < 4) {
      throw new BadRequestException(
        'Valid phone number and verification code are required',
      );
    }

    // Simulate SMS verification step here directly for the update
    const user = await this.userModel.findById(req.user.userId);
    if (!user) throw new BadRequestException('User not found');

    // Check if phone number is already taken
    const existing = await this.userModel.findOne({ phoneNumber });
    if (existing && existing._id.toString() !== user._id.toString()) {
      throw new BadRequestException('Phone number is already in use');
    }

    user.phoneNumber = phoneNumber;
    await user.save();

    // Issue a new JWT token because phoneNumber is part of the payload
    const payload = {
      sub: user._id,
      phoneNumber: user.phoneNumber,
      role: user.role,
    };

    return {
      success: true,
      user: {
        userId: user._id,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  // PUT /users/me/password — update user password
  @UseGuards(JwtAuthGuard)
  @Put('me/password')
  async updatePassword(@Req() req: AuthRequest, @Body() body: any) {
    const { currentPassword, newPassword } = body;
    if (!currentPassword || !newPassword) {
      throw new BadRequestException('Current and new passwords are required');
    }

    const user = await this.userModel.findById(req.user.userId).exec();
    if (!user) throw new BadRequestException('User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Incorrect current password');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    user.passwordHash = passwordHash;
    await user.save();

    return { success: true, message: 'Password updated successfully' };
  }

  // GET /users/favorites — returns the user's favorite partner IDs
  @UseGuards(JwtAuthGuard)
  @Get('favorites')
  async getFavorites(@Req() req: AuthRequest) {
    const user = await this.userModel
      .findById(req.user.userId)
      .select('favorites')
      .exec();
    return user?.favorites || [];
  }

  // POST /users/favorites/:partnerId — add a partner to favorites
  @UseGuards(JwtAuthGuard)
  @Post('favorites/:partnerId')
  async addFavorite(
    @Req() req: AuthRequest,
    @Param('partnerId') partnerId: string,
  ) {
    await this.userModel.findByIdAndUpdate(req.user.userId, {
      $addToSet: { favorites: partnerId },
    });
    return { success: true };
  }

  // DELETE /users/favorites/:partnerId — remove a partner from favorites
  @UseGuards(JwtAuthGuard)
  @Delete('favorites/:partnerId')
  async removeFavorite(
    @Req() req: AuthRequest,
    @Param('partnerId') partnerId: string,
  ) {
    await this.userModel.findByIdAndUpdate(req.user.userId, {
      $pull: { favorites: partnerId },
    });
    return { success: true };
  }
}
