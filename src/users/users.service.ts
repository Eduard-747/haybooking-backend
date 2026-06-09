import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async onModuleInit() {
    await this.seedSuperAdmin();
  }

  private async seedSuperAdmin() {
    const superAdminPhone = 'haybooking_super_admin';
    const existingAdmin = await this.userModel.findOne({
      phoneNumber: superAdminPhone,
    });

    if (!existingAdmin) {
      this.logger.log('Seeding super admin user...');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('haybooking2026', salt);

      const superAdmin = new this.userModel({
        phoneNumber: superAdminPhone,
        passwordHash,
        name: 'Super',
        surname: 'Admin',
        role: 'super_admin',
      });

      await superAdmin.save();
      this.logger.log('Super admin user created successfully.');
    } else {
      this.logger.log('Super admin user already exists.');
    }
  }
}
