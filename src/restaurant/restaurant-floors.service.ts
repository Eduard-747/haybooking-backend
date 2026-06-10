import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Floor, FloorDocument } from './schemas/floor.schema';

@Injectable()
export class RestaurantFloorsService {
  constructor(
    @InjectModel(Floor.name) private floorModel: Model<FloorDocument>,
  ) {}

  async create(data: any): Promise<Floor> {
    const createdFloor = new this.floorModel(data);
    return createdFloor.save();
  }

  async findAllByBranch(branchId: string): Promise<Floor[]> {
    return this.floorModel.find({ branchId } as any).sort({ order: 1 }).exec();
  }

  async findOne(id: string): Promise<Floor> {
    const floor = await this.floorModel.findById(id).exec();
    if (!floor) {
      throw new NotFoundException(`Floor #${id} not found`);
    }
    return floor;
  }

  async update(id: string, data: any): Promise<Floor> {
    const updatedFloor = await this.floorModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
    if (!updatedFloor) {
      throw new NotFoundException(`Floor #${id} not found`);
    }
    return updatedFloor;
  }

  async remove(id: string): Promise<Floor> {
    const deletedFloor = await this.floorModel.findByIdAndDelete(id).exec();
    if (!deletedFloor) {
      throw new NotFoundException(`Floor #${id} not found`);
    }
    return deletedFloor;
  }
}
