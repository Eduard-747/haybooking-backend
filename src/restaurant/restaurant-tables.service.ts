import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Table, TableDocument } from './schemas/table.schema';

@Injectable()
export class RestaurantTablesService {
  constructor(
    @InjectModel(Table.name) private tableModel: Model<TableDocument>,
  ) {}

  async create(data: any): Promise<Table> {
    const createdTable = new this.tableModel(data);
    return createdTable.save();
  }

  async findAllByBranch(branchId: string): Promise<Table[]> {
    return this.tableModel.find({ branchId } as any).exec();
  }

  async findAllByPartner(partnerId: string): Promise<Table[]> {
    return this.tableModel.find({ partnerId } as any).exec();
  }

  async findAllByFloor(floorId: string): Promise<Table[]> {
    return this.tableModel.find({ floorId } as any).exec();
  }

  async findOne(id: string): Promise<Table> {
    const table = await this.tableModel.findById(id).exec();
    if (!table) {
      throw new NotFoundException(`Table #${id} not found`);
    }
    return table;
  }

  async update(id: string, data: any): Promise<Table> {
    const updatedTable = await this.tableModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
    if (!updatedTable) {
      throw new NotFoundException(`Table #${id} not found`);
    }
    return updatedTable;
  }

  async remove(id: string): Promise<Table> {
    const deletedTable = await this.tableModel.findByIdAndDelete(id).exec();
    if (!deletedTable) {
      throw new NotFoundException(`Table #${id} not found`);
    }
    return deletedTable;
  }
}
