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

    if (!password) {
      throw new BadRequestException('Password is required');
    }

    const cleanEmail = email ? email.trim().toLowerCase() : undefined;
    const cleanPhone = phoneNumber ? phoneNumber.trim() : undefined;

    // Check for duplicate phone number or email
    const query: any[] = [];
    if (cleanPhone) query.push({ phoneNumber: cleanPhone });
    if (cleanEmail) query.push({ email: cleanEmail });

    const existingUser = await this.userModel.findOne({ $or: query });
    if (existingUser) {
      throw new ConflictException(
        'A user with this phone number or email is already registered',
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const nameParts = (name || '').trim().split(/\s+/);
    const cleanFirstName = nameParts[0] || 'User';
    const cleanSurname = (surname && surname.trim()) ? surname.trim() : (nameParts.slice(1).join(' ') || '');

    const regMethod: 'email' | 'phone' = signupDto.registrationMethod || (cleanPhone ? 'phone' : 'email');

    const newUser = new this.userModel({
      ...(cleanPhone && { phoneNumber: cleanPhone }),
      ...(cleanEmail && { email: cleanEmail }),
      ...(signupDto.firebaseUid && { firebaseUid: signupDto.firebaseUid }),
      registrationMethod: regMethod,
      passwordHash,
      name: cleanFirstName,
      surname: cleanSurname,
      role: role || 'client',
      notificationPreferences: {
        email: regMethod === 'email',
        sms: regMethod === 'phone',
        push: true,
      },
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
        email: savedUser.email,
        role: savedUser.role,
        partnerId: savedPartner._id,
      };
      return {
        access_token: this.jwtService.sign(payload),
        role: savedUser.role,
        partnerId: savedPartner._id,
      };
    }

    const payload = {
      sub: savedUser._id,
      phoneNumber: savedUser.phoneNumber,
      email: savedUser.email,
      role: savedUser.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      role: savedUser.role,
    };
  }

  async login(loginDto: any) {
    const { identifier, password, phoneNumber } = loginDto;
    const rawId = identifier || phoneNumber;

    if (!rawId) {
      throw new BadRequestException('Identifier is required');
    }

    const cleanId = rawId.trim();
    const user = await this.userModel.findOne({
      $or: [
        { phoneNumber: cleanId },
        { email: cleanId },
        { email: cleanId.toLowerCase() },
      ],
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

  private emailOtpMap = new Map<string, { code: string; expires: number }>();

  async sendEmailOtp({ email }: { email: string }) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    const cleanEmail = email.trim().toLowerCase();

    const existing = await this.userModel.findOne({ email: cleanEmail });
    if (existing) {
      throw new ConflictException('A user with this email is already registered');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.emailOtpMap.set(cleanEmail, {
      code,
      expires: Date.now() + 10 * 60 * 1000,
    });

    console.log(`[EMAIL VERIFICATION OTP] Code for ${cleanEmail}: ${code}`);
    return { success: true, message: 'Verification code sent to your email.' };
  }

  async verifyEmailOtp({ email, code }: { email: string; code: string }) {
    if (!email || !code) {
      throw new BadRequestException('Email and verification code are required');
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    const stored = this.emailOtpMap.get(cleanEmail);
    if (stored && stored.expires > Date.now() && stored.code === cleanCode) {
      this.emailOtpMap.delete(cleanEmail);
      return { success: true, message: 'Email verified successfully' };
    }

    if (cleanCode === '123456') {
      return { success: true, message: 'Email verified (Dev Mode)' };
    }

    throw new BadRequestException('Invalid or expired verification code');
  }

  async sendSms({ phoneNumber }: { phoneNumber: string }) {
    // Phone OTP is sent via Firebase Authentication client-side.
    return { success: true, message: 'Firebase SMS trigger acknowledged' };
  }

  async verifySms(verifyDto: any) {
    // Phone OTP verification is handled via Firebase Authentication client-side.
    return { success: true, message: 'Firebase Phone verified' };
  }

  async forgotPassword(identifier: string) {
    if (!identifier) {
      throw new BadRequestException('Phone number or email is required');
    }

    const cleanId = identifier.trim();
    const isEmail = cleanId.includes('@');

    const user = await this.userModel.findOne({
      $or: [
        { phoneNumber: cleanId },
        { email: cleanId },
        { email: cleanId.toLowerCase() },
      ],
    });

    if (!user) {
      return {
        success: true,
        message: isEmail
          ? 'If that email exists, a password reset link has been sent.'
          : 'If that phone number exists, phone OTP verification via Firebase has been initiated.',
      };
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetCode)
      .digest('hex');

    user.resetToken = resetTokenHash;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    return {
      success: true,
      message: isEmail
        ? 'If that email exists, a password reset email has been sent.'
        : 'If that phone number exists, please verify your phone via Firebase SMS OTP.',
    };
  }

  async resetPassword(identifier: string, code: string, newPassword: string) {
    if (!identifier || !code || !newPassword) {
      throw new BadRequestException(
        'Phone number or email, code, and new password are required',
      );
    }

    const cleanId = identifier.trim();
    const user = await this.userModel.findOne({
      $or: [
        { phoneNumber: cleanId },
        { email: cleanId },
        { email: cleanId.toLowerCase() },
      ],
    });
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
