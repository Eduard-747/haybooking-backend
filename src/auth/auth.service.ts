import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Partner, PartnerDocument } from '../partners/schemas/partner.schema';
import { PartnersService } from '../partners/partners.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private partnersService: PartnersService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Partner.name) private partnerModel: Model<PartnerDocument>,
  ) {}

  async signup(signupDto: any) {
    const {
      phoneNumber,
      email,
      password,
      name,
      surname,
      role,
      businessName,
      businessType,
    } = signupDto;

    if (!phoneNumber && !email) {
      throw new BadRequestException('Either phone number or email is required');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Check for duplicate phone number or email
    const query: any[] = [];
    if (phoneNumber) query.push({ phoneNumber });
    if (email) query.push({ email });

    const existingUser = await this.userModel.findOne({ $or: query });
    if (existingUser) {
      throw new ConflictException('A user with this phone number or email is already registered');
    }

    const newUser = new this.userModel({
      ...(phoneNumber && { phoneNumber }),
      ...(email && { email }),
      passwordHash,
      name,
      surname,
      role: role || 'client',
    });

    const savedUser = await newUser.save();

    if (role === 'partner') {
      const bName = businessName || `${name}'s Business`;
      const slug = await this.partnersService.generateSlug(bName);
      const newPartner = new this.partnerModel({
        userId: savedUser._id,
        businessName: bName,
        businessType: businessType || 'other',
        slug,
        subscriptionStatus: false,
      });
      const savedPartner = await newPartner.save();

      // Return token with partnerId directly
      const payload = {
        sub: savedUser._id,
        phoneNumber: savedUser.phoneNumber,
        role: savedUser.role,
        partnerId: savedPartner._id,
      };
      return {
        access_token: this.jwtService.sign(payload),
        role: savedUser.role,
        partnerId: savedPartner._id,
      };
    }

    return this.login({ identifier: email || phoneNumber, password });
  }

  async login(loginDto: any) {
    const { identifier, password, phoneNumber } = loginDto;
    const idToUse = identifier || phoneNumber;
    
    if (!idToUse) {
      throw new BadRequestException('Identifier is required');
    }

    const user = await this.userModel.findOne({
      $or: [{ phoneNumber: idToUse }, { email: idToUse }]
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    let partnerId: any = undefined;
    if (user.role === 'partner') {
      const partner = await this.partnerModel.findOne({
        userId: user._id,
      } as any);
      partnerId = partner?._id;
    }

    const payload: any = {
      sub: user._id,
      phoneNumber: user.phoneNumber,
      role: user.role,
    };
    if (partnerId) payload.partnerId = partnerId;

    return {
      access_token: this.jwtService.sign(payload),
      role: user.role,
      ...(partnerId && { partnerId }),
    };
  }

  async googleLogin(req: any) {
    if (!req.user) {
      throw new UnauthorizedException('No user from google');
    }

    const { email, firstName, lastName, googleId } = req.user;

    let user = await this.userModel.findOne({ googleId });

    if (!user) {
      user = await this.userModel.findOne({ email });

      if (user) {
        user.googleId = googleId;
        await user.save();
      } else {
        user = new this.userModel({
          email: email,
          name: firstName,
          surname: lastName,
          googleId,
          role: 'client',
        });
        await user.save();
      }
    }

    const payload = {
      sub: user._id,
      phoneNumber: user.phoneNumber,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async sendSms({ phoneNumber }: { phoneNumber: string }) {
    // Simulated SMS send
    console.log(`[SIMULATED SMS] Sent verification code to ${phoneNumber}`);
    return { success: true, message: 'Verification code sent' };
  }

  async verifySms(verifyDto: any) {
    // Simulated verification (accepts any code for now)
    const { phoneNumber, code } = verifyDto;
    if (!code || code.length < 4) {
      throw new UnauthorizedException('Invalid verification code');
    }
    return { success: true, message: 'SMS verified' };
  }

  async forgotPassword(phoneNumber: string) {
    if (!phoneNumber) {
      throw new BadRequestException('Phone number is required');
    }

    const user = await this.userModel.findOne({ phoneNumber });
    // "Do not reveal whether a phone number exists in the system."
    if (!user) {
      return {
        success: true,
        message:
          'If that phone number exists, a password reset code has been sent via SMS.',
      };
    }

    // Generate a 6-digit numeric code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetCode)
      .digest('hex');

    user.resetToken = resetTokenHash;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry
    await user.save();

    // Simulated SMS
    console.log(`[SIMULATED SMS] Password reset requested for ${phoneNumber}`);
    console.log(`[SIMULATED SMS] Your password reset code is: ${resetCode}`);

    return {
      success: true,
      message:
        'If that phone number exists, a password reset code has been sent via SMS.',
    };
  }

  async resetPassword(phoneNumber: string, code: string, newPassword: string) {
    if (!phoneNumber || !code || !newPassword) {
      throw new BadRequestException(
        'Phone number, code, and new password are required',
      );
    }

    const user = await this.userModel.findOne({ phoneNumber });
    if (!user) {
      throw new BadRequestException('Invalid or expired password reset code');
    }

    if (
      !user.resetToken ||
      !user.resetTokenExpiry ||
      user.resetTokenExpiry < new Date()
    ) {
      throw new BadRequestException('Invalid or expired password reset code');
    }

    const resetTokenHash = crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');
    if (user.resetToken !== resetTokenHash) {
      throw new BadRequestException('Invalid or expired password reset code');
    }

    // Prevent reuse of current password
    if (user.passwordHash) {
      const isSamePassword = await bcrypt.compare(
        newPassword,
        user.passwordHash,
      );
      if (isSamePassword) {
        throw new ConflictException(
          'New password cannot be the same as your current password',
        );
      }
    }

    // Enforce strong password requirements
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new BadRequestException(
        'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters (@$!%*?&)',
      );
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    // Invalidate reset token
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return {
      success: true,
      message: 'Password has been successfully reset. You can now log in.',
    };
  }
}
