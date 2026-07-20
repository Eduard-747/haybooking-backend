import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { RestaurantMenuFileService } from './restaurant-menu-file.service';

@Controller('restaurant/menu-file')
export class RestaurantMenuFileController {
  constructor(private readonly menuFileService: RestaurantMenuFileService) {}

  @Post()
  create(@Body() createDto: any) {
    return this.menuFileService.create(createDto);
  }

  @Get()
  findAll(
    @Query('partnerId') partnerId?: string,
    @Query('branchId') branchId?: string,
  ) {
    if (partnerId && branchId) {
      return this.menuFileService.findAllForBranchAndPartner(partnerId, branchId);
    }
    if (branchId) {
      return this.menuFileService.findAllByBranch(branchId);
    }
    if (partnerId) {
      return this.menuFileService.findAllByPartner(partnerId);
    }
    return [];
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menuFileService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.menuFileService.remove(id);
  }
}
