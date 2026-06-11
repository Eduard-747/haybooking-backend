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
import { RestaurantFloorsService } from './restaurant-floors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('restaurant/floors')
export class RestaurantFloorsController {
  constructor(private readonly floorsService: RestaurantFloorsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createFloorDto: any) {
    return this.floorsService.create(createFloorDto);
  }

  @Get()
  findAll(@Query('branchId') branchId: string) {
    if (branchId) {
      return this.floorsService.findAllByBranch(branchId);
    }
    return [];
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.floorsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateFloorDto: any) {
    return this.floorsService.update(id, updateFloorDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.floorsService.remove(id);
  }
}
