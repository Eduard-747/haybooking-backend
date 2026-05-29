import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
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
      password,
      name,
      surname,
      role,
      businessName,
      businessType,
    } = signupDto;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Check for duplicate phone number
    const existingUser = await this.userModel.findOne({ phoneNumber });
    if (existingUser) {
      throw new ConflictException('Phone number already registered');
    }

    const newUser = new this.userModel({
      phoneNumber,
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

    return this.login({ phoneNumber, password });
  }

  async login(loginDto: any) {
    const { phoneNumber, password } = loginDto;
    const user = await this.userModel.findOne({ phoneNumber });

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
          phoneNumber: `google-${googleId}`,
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
}
