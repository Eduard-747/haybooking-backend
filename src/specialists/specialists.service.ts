import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Specialist, SpecialistDocument } from './schemas/specialist.schema';
import {
  generateQueryVariants,
  escapeRegex,
} from '../common/utils/search-transliteration.util';

@Injectable()
export class SpecialistsService {
  constructor(
    @InjectModel(Specialist.name)
    private specialistModel: Model<SpecialistDocument>,
  ) {}

  async create(data: any): Promise<Specialist> {
    const specialist = new this.specialistModel(data);
    return specialist.save();
  }

  async findByPartner(partnerId?: string, query?: string): Promise<Specialist[]> {
    const filter: any = {};
    if (partnerId) {
      filter.partnerId = partnerId;
    }
    if (query && query.trim()) {
      const { variants } = generateQueryVariants(query);
      if (variants.length > 0) {
        filter.$or = variants.flatMap((v) => {
          const escaped = escapeRegex(v);
          return [
            { name: { $regex: escaped, $options: 'i' } },
          ];
        });
      }
    }

    return this.specialistModel
      .find(filter)
      .populate('assignedBranches', 'address phoneNumber')
      .populate('assignedServices', 'name duration price')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Specialist | null> {
    return this.specialistModel.findById(id).exec();
  }

  async update(id: string, data: any): Promise<Specialist | null> {
    return this.specialistModel
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .exec();
  }

  async remove(id: string): Promise<Specialist | null> {
    return this.specialistModel.findByIdAndDelete(id).exec();
  }
}
