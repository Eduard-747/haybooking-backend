import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Service, ServiceDocument } from './schemas/service.schema';
import { CreateServiceDto } from './dto/create-service.dto';
import {
  generateQueryVariants,
  escapeRegex,
} from '../common/utils/search-transliteration.util';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    const createdService = new this.serviceModel(createServiceDto);
    return createdService.save();
  }

  async findAll(query?: string, category?: string): Promise<Service[]> {
    const filter: any = {};
    if (category && category !== 'All') {
      filter.category = { $regex: new RegExp(`^${escapeRegex(category)}$`, 'i') };
    }
    if (query && query.trim()) {
      const { variants } = generateQueryVariants(query);
      if (variants.length > 0) {
        filter.$or = variants.flatMap((v) => {
          const escaped = escapeRegex(v);
          return [
            { name: { $regex: escaped, $options: 'i' } },
            { category: { $regex: escaped, $options: 'i' } },
            { description: { $regex: escaped, $options: 'i' } },
          ];
        });
      }
    }
    return this.serviceModel.find(filter).exec();
  }

  async findByPartner(partnerId: string, query?: string): Promise<Service[]> {
    const filter: any = { partnerId };
    if (query && query.trim()) {
      const { variants } = generateQueryVariants(query);
      if (variants.length > 0) {
        filter.$or = variants.flatMap((v) => {
          const escaped = escapeRegex(v);
          return [
            { name: { $regex: escaped, $options: 'i' } },
            { category: { $regex: escaped, $options: 'i' } },
            { description: { $regex: escaped, $options: 'i' } },
          ];
        });
      }
    }
    return this.serviceModel.find(filter).exec();
  }

  async findOne(id: string): Promise<Service | null> {
    return this.serviceModel.findById(id).exec();
  }

  async update(
    id: string,
    updateData: Partial<CreateServiceDto>,
  ): Promise<Service | null> {
    return this.serviceModel
      .findByIdAndUpdate(id, updateData, { returnDocument: 'after' })
      .exec();
  }

  async remove(id: string): Promise<Service | null> {
    return this.serviceModel.findByIdAndDelete(id).exec();
  }
}
