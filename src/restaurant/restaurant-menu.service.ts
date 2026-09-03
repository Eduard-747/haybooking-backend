import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MenuItem, MenuItemDocument } from './schemas/menu-item.schema';
import {
  generateQueryVariants,
  escapeRegex,
} from '../common/utils/search-transliteration.util';

@Injectable()
export class RestaurantMenuService {
  constructor(
    @InjectModel(MenuItem.name) private menuItemModel: Model<MenuItemDocument>,
  ) {}

  private buildQueryFilter(baseFilter: any, query?: string): any {
    if (!query || !query.trim()) return baseFilter;
    const { variants } = generateQueryVariants(query);
    if (!variants.length) return baseFilter;

    const orConditions = variants.flatMap((v) => {
      const escaped = escapeRegex(v);
      return [
        { name: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
        { category: { $regex: escaped, $options: 'i' } },
      ];
    });

    return {
      $and: [baseFilter, { $or: orConditions }],
    };
  }

  async create(createDto: any): Promise<MenuItem> {
    const createdItem = new this.menuItemModel(createDto);
    return createdItem.save();
  }

  async findAllByPartner(partnerId: string, query?: string): Promise<MenuItem[]> {
    const filter = this.buildQueryFilter({ partnerId }, query);
    return this.menuItemModel.find(filter).exec();
  }

  async findAllByBranch(branchId: string, query?: string): Promise<MenuItem[]> {
    const filter = this.buildQueryFilter({ branchId }, query);
    return this.menuItemModel.find(filter).exec();
  }

  async findAllForBranchAndPartner(partnerId: string, branchId: string, query?: string): Promise<MenuItem[]> {
    const baseFilter = {
      partnerId,
      $or: [
        { branchId },
        { branchId: { $exists: false } },
        { branchId: null }
      ]
    };
    const filter = this.buildQueryFilter(baseFilter, query);
    return this.menuItemModel.find(filter).exec();
  }

  async findOne(id: string): Promise<MenuItem> {
    const item = await this.menuItemModel.findById(id).exec();
    if (!item) throw new NotFoundException('Menu item not found');
    return item;
  }

  async update(id: string, updateDto: any): Promise<MenuItem> {
    const item = await this.menuItemModel
      .findByIdAndUpdate(id, updateDto, { returnDocument: 'after' })
      .exec();
    if (!item) throw new NotFoundException('Menu item not found');
    return item;
  }

  async remove(id: string): Promise<void> {
    const result = await this.menuItemModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Menu item not found');
  }
}
