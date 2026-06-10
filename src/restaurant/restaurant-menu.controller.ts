import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { RestaurantMenuService } from './restaurant-menu.service';

@Controller('restaurant/menu')
export class RestaurantMenuController {
  constructor(private readonly menuService: RestaurantMenuService) {}

  @Post()
  create(@Body() createDto: any) {
    return this.menuService.create(createDto);
  }

  @Get()
  findAll(@Query('partnerId') partnerId?: string, @Query('branchId') branchId?: string) {
    if (branchId) {
      return this.menuService.findAllByBranch(branchId);
    }
    if (partnerId) {
      return this.menuService.findAllByPartner(partnerId);
    }
    return [];
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menuService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.menuService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.menuService.remove(id);
  }
}
