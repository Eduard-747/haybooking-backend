import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Partner, PartnerDocument } from './schemas/partner.schema';
import {
  generateQueryVariants,
  escapeRegex,
} from '../common/utils/search-transliteration.util';

@Injectable()
export class PartnersService implements OnModuleInit {
  private readonly logger = new Logger(PartnersService.name);

  constructor(
    @InjectModel(Partner.name) private partnerModel: Model<PartnerDocument>,
  ) {}

  async onModuleInit() {
    this.logger.log('Migrating existing partners to active status...');
    const result = await this.partnerModel.updateMany(
      { $or: [{ status: { $exists: false } }, { status: 'pending' }] },
      { $set: { status: 'active' } },
    );
    this.logger.log(`Migrated ${result.modifiedCount} partners.`);
  }

  async findAll(options?: {
    query?: string;
    category?: string;
    limit?: number;
    page?: number;
  }): Promise<any[]> {
    const matchStage: any = { status: 'active' };

    if (options?.category && options.category !== 'All') {
      matchStage.businessType = {
        $regex: new RegExp(`^${escapeRegex(options.category)}$`, 'i'),
      };
    }

    let searchVariants: string[] = [];
    if (options?.query && options.query.trim()) {
      const transResult = generateQueryVariants(options.query);
      searchVariants = transResult.variants;
    }

    const pipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: 'partnerId',
          as: 'partnerServices',
        },
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
          bookings: 0,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userId',
        },
      },
      {
        $unwind: {
          path: '$userId',
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    if (options?.query && searchVariants.length > 0) {
      const postLookupOr = searchVariants.flatMap((variant) => {
        const escaped = escapeRegex(variant);
        return [
          { businessName: { $regex: escaped, $options: 'i' } },
          { businessType: { $regex: escaped, $options: 'i' } },
          { description: { $regex: escaped, $options: 'i' } },
          { publicDescription: { $regex: escaped, $options: 'i' } },
          { slug: { $regex: escaped, $options: 'i' } },
          { 'partnerServices.name': { $regex: escaped, $options: 'i' } },
          { 'partnerServices.category': { $regex: escaped, $options: 'i' } },
          { 'partnerServices.description': { $regex: escaped, $options: 'i' } },
        ];
      });

      pipeline.push({ $match: { $or: postLookupOr } });

      const primaryEscaped = escapeRegex(options.query.trim());
      pipeline.push({
        $addFields: {
          relevanceScore: {
            $add: [
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: '$businessName',
                      regex: `^${primaryEscaped}`,
                      options: 'i',
                    },
                  },
                  100,
                  0,
                ],
              },
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: '$businessName',
                      regex: primaryEscaped,
                      options: 'i',
                    },
                  },
                  50,
                  0,
                ],
              },
              {
                $cond: [
                  {
                    $gt: [
                      {
                        $size: {
                          $filter: {
                            input: '$partnerServices',
                            as: 'ps',
                            cond: {
                              $regexMatch: {
                                input: '$$ps.name',
                                regex: primaryEscaped,
                                options: 'i',
                              },
                            },
                          },
                        },
                      },
                      0,
                    ],
                  },
                  40,
                  0,
                ],
              },
            ],
          },
        },
      });
      pipeline.push({ $sort: { relevanceScore: -1, bookingCount: -1, createdAt: -1 } });
    } else {
      pipeline.push({ $sort: { subscriptionStatus: -1, bookingCount: -1, createdAt: -1 } });
    }

    if (options?.page && options?.limit) {
      const skip = (options.page - 1) * options.limit;
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: options.limit });
    } else if (options?.limit) {
      pipeline.push({ $limit: options.limit });
    }

    return this.partnerModel.aggregate(pipeline).exec();
  }

  async findAllAdmin(): Promise<any[]> {
    return this.partnerModel
      .aggregate([
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
            as: 'userId',
          },
        },
        {
          $unwind: {
            path: '$userId',
            preserveNullAndEmptyArrays: true,
          },
        },
      ])
      .exec();
  }

  async findOne(id: string): Promise<Partner | null> {
    return this.partnerModel
      .findOne({ _id: id, status: 'active' } as any)
      .populate('userId')
      .exec();
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
    return this.partnerModel
      .findByIdAndUpdate(id, data, {
        returnDocument: 'after',
      })
      .exec();
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
