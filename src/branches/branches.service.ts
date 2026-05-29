import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Branch, BranchDocument } from './schemas/branch.schema';

@Injectable()
export class BranchesService {
  constructor(
    @InjectModel(Branch.name) private branchModel: Model<BranchDocument>,
  ) {}

  async create(data: any): Promise<Branch> {
    const branch = new this.branchModel(data);
    return branch.save();
  }

  async findByPartner(partnerId: string): Promise<Branch[]> {
    return this.branchModel
      .find({ partnerId } as any)
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAll(): Promise<Branch[]> {
    return this.branchModel.find().populate('partnerId').exec();
  }

  async findOne(id: string): Promise<Branch | null> {
    return this.branchModel.findById(id).exec();
  }

  async update(id: string, data: any): Promise<Branch | null> {
    return this.branchModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async remove(id: string): Promise<Branch | null> {
    return this.branchModel.findByIdAndDelete(id).exec();
  }
}
