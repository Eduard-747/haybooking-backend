import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MenuItem, MenuItemDocument } from './schemas/menu-item.schema';

@Injectable()
export class RestaurantMenuService {
  constructor(
    @InjectModel(MenuItem.name) private menuItemModel: Model<MenuItemDocument>,
  ) {}

  async create(createDto: any): Promise<MenuItem> {
    const createdItem = new this.menuItemModel(createDto);
    return createdItem.save();
  }

  async findAllByPartner(partnerId: string): Promise<MenuItem[]> {
    return this.menuItemModel.find({ partnerId } as any).exec();
  }

  async findAllByBranch(branchId: string): Promise<MenuItem[]> {
    return this.menuItemModel.find({ branchId } as any).exec();
  }

  async findOne(id: string): Promise<MenuItem> {
    const item = await this.menuItemModel.findById(id).exec();
    if (!item) throw new NotFoundException('Menu item not found');
    return item;
  }

  async update(id: string, updateDto: any): Promise<MenuItem> {
    const item = await this.menuItemModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
    if (!item) throw new NotFoundException('Menu item not found');
    return item;
  }

  async remove(id: string): Promise<void> {
    const result = await this.menuItemModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Menu item not found');
  }
}
