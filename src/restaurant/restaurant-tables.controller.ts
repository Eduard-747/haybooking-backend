import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Put,
} from '@nestjs/common';
import { RestaurantTablesService } from './restaurant-tables.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('restaurant/tables')
export class RestaurantTablesController {
  constructor(private readonly tablesService: RestaurantTablesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createTableDto: any) {
    return this.tablesService.create(createTableDto);
  }

  @Get()
  findAll(
    @Query('partnerId') partnerId: string,
    @Query('branchId') branchId: string,
    @Query('floorId') floorId: string,
  ) {
    if (floorId) {
      return this.tablesService.findAllByFloor(floorId);
    }
    if (branchId) {
      return this.tablesService.findAllByBranch(branchId);
    }
    if (partnerId) {
      return this.tablesService.findAllByPartner(partnerId);
    }
    return [];
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tablesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateTableDto: any) {
    return this.tablesService.update(id, updateTableDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.tablesService.update(id, { status });
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tablesService.remove(id);
  }
}
