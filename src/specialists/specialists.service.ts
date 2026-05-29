import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Specialist, SpecialistDocument } from './schemas/specialist.schema';

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

  async findByPartner(partnerId: string): Promise<Specialist[]> {
    return this.specialistModel
      .find({ partnerId } as any)
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
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Specialist | null> {
    return this.specialistModel.findByIdAndDelete(id).exec();
  }
}
