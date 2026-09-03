import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Partner, PartnerDocument } from '../partners/schemas/partner.schema';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { Specialist, SpecialistDocument } from '../specialists/schemas/specialist.schema';
import { Branch, BranchDocument } from '../branches/schemas/branch.schema';
import {
  generateQueryVariants,
  escapeRegex,
  SupportedLanguage,
} from '../common/utils/search-transliteration.util';

export interface GlobalSearchResult {
  query: string;
  detectedLanguage: SupportedLanguage;
  variants: string[];
  partners: any[];
  services: any[];
  specialists: any[];
  branches: any[];
}

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Partner.name) private partnerModel: Model<PartnerDocument>,
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
    @InjectModel(Specialist.name) private specialistModel: Model<SpecialistDocument>,
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
  ) {}

  async searchAll(
    query: string,
    limit: number = 10,
    category?: string,
  ): Promise<GlobalSearchResult> {
    const { primaryLang, variants } = generateQueryVariants(query);
    if (!variants.length) {
      return {
        query,
        detectedLanguage: primaryLang,
        variants: [],
        partners: [],
        services: [],
        specialists: [],
        branches: [],
      };
    }

    const partnerMatch: any = { status: 'active' };
    if (category && category !== 'All') {
      partnerMatch.businessType = {
        $regex: new RegExp(`^${escapeRegex(category)}$`, 'i'),
      };
    }

    const postLookupOr = variants.flatMap((v) => {
      const escaped = escapeRegex(v);
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

    const primaryEscaped = escapeRegex(query.trim());

    const partnersPromise = this.partnerModel
      .aggregate([
        { $match: partnerMatch },
        {
          $lookup: {
            from: 'services',
            localField: '_id',
            foreignField: 'partnerId',
            as: 'partnerServices',
          },
        },
        { $match: { $or: postLookupOr } },
        {
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
              ],
            },
          },
        },
        { $sort: { relevanceScore: -1, createdAt: -1 } },
        { $limit: limit },
      ])
      .exec();

    const serviceOr = variants.flatMap((v) => {
      const escaped = escapeRegex(v);
      return [
        { name: { $regex: escaped, $options: 'i' } },
        { category: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
      ];
    });
    const servicesPromise = this.serviceModel
      .find({ $or: serviceOr })
      .populate('partnerId', 'businessName logo slug')
      .limit(limit)
      .exec();

    const specialistOr = variants.flatMap((v) => [
      { name: { $regex: escapeRegex(v), $options: 'i' } },
    ]);
    const specialistsPromise = this.specialistModel
      .find({ $or: specialistOr })
      .populate('partnerId', 'businessName logo slug')
      .limit(limit)
      .exec();

    const branchOr = variants.flatMap((v) => {
      const escaped = escapeRegex(v);
      return [
        { 'address.line1': { $regex: escaped, $options: 'i' } },
        { 'address.city': { $regex: escaped, $options: 'i' } },
        { 'address.country': { $regex: escaped, $options: 'i' } },
      ];
    });
    const branchesPromise = this.branchModel
      .find({ $or: branchOr })
      .populate('partnerId', 'businessName logo slug')
      .limit(limit)
      .exec();

    const [partners, services, specialists, branches] = await Promise.all([
      partnersPromise,
      servicesPromise,
      specialistsPromise,
      branchesPromise,
    ]);

    return {
      query,
      detectedLanguage: primaryLang,
      variants,
      partners,
      services,
      specialists,
      branches,
    };
  }
}
