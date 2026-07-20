import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MenuFile, MenuFileDocument } from './schemas/menu-file.schema';

@Injectable()
export class RestaurantMenuFileService {
  constructor(
    @InjectModel(MenuFile.name) private menuFileModel: Model<MenuFileDocument>,
  ) {}

  async create(data: Partial<MenuFile>): Promise<MenuFile> {
    const createdMenuFile = new this.menuFileModel(data);
    return createdMenuFile.save();
  }

  async findAllByPartner(partnerId: string): Promise<MenuFile[]> {
    return this.menuFileModel.find({ partnerId: new Types.ObjectId(partnerId) as any }).sort({ createdAt: -1 }).exec();
  }

  async findAllByBranch(branchId: string): Promise<MenuFile[]> {
    return this.menuFileModel.find({ branchId: new Types.ObjectId(branchId) as any }).sort({ createdAt: -1 }).exec();
  }

  async findAllForBranchAndPartner(partnerId: string, branchId: string): Promise<MenuFile[]> {
    return this.menuFileModel.find({ 
      partnerId: new Types.ObjectId(partnerId) as any,
      branchId: new Types.ObjectId(branchId) as any
    }).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<MenuFile> {
    const file = await this.menuFileModel.findById(id).exec();
    if (!file) {
      throw new NotFoundException(`MenuFile with ID ${id} not found`);
    }
    return file;
  }

  async remove(id: string): Promise<void> {
    const result = await this.menuFileModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`MenuFile with ID ${id} not found`);
    }
  }
}
