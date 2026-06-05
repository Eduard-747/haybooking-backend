import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Partner, PartnerDocument } from './schemas/partner.schema';

@Injectable()
export class PartnersService implements OnModuleInit {
  private readonly logger = new Logger(PartnersService.name);

  constructor(
    @InjectModel(Partner.name) private partnerModel: Model<PartnerDocument>,
  ) {}

  async onModuleInit() {
    this.logger.log('Migrating existing partners to active status...');
    const result = await this.partnerModel.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'active' } }
    );
    this.logger.log(`Migrated ${result.modifiedCount} partners.`);
  }

  async findAll(): Promise<any[]> {
    return this.partnerModel.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'partnerId',
          as: 'bookings',
        },
      },
      {
        $addFields: {
          bookingCount: { $size: '$bookings' },
        },
      },
      {
        $project: {
          bookings: 0, // exclude the actual booking objects to save bandwidth
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userId'
        }
      },
      {
        $unwind: {
          path: '$userId',
          preserveNullAndEmptyArrays: true
        }
      }
    ]).exec();
  }

  async findAllAdmin(): Promise<any[]> {
    return this.partnerModel.aggregate([
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'partnerId',
          as: 'bookings',
        },
      },
      {
        $addFields: {
          bookingCount: { $size: '$bookings' },
        },
      },
      {
        $project: {
          bookings: 0,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userId'
        }
      },
      {
        $unwind: {
          path: '$userId',
          preserveNullAndEmptyArrays: true
        }
      }
    ]).exec();
  }

  async findOne(id: string): Promise<Partner | null> {
    return this.partnerModel.findOne({ _id: id, status: 'active' }).populate('userId').exec();
  }

  async findByUserId(userId: string): Promise<Partner | null> {
    return this.partnerModel.findOne({ userId } as any).exec();
  }

  async findBySlug(slug: string): Promise<Partner | null> {
    return this.partnerModel
      .findOne({ slug, status: 'active' } as any)
      .populate('userId')
      .exec();
  }

  async update(id: string, data: any): Promise<Partner | null> {
    return this.partnerModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async generateSlug(businessName: string): Promise<string> {
    const slug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    let candidate = slug;
    let counter = 1;
    while (await this.partnerModel.findOne({ slug: candidate }).exec()) {
      candidate = `${slug}-${counter}`;
      counter++;
    }
    return candidate;
  }
}
