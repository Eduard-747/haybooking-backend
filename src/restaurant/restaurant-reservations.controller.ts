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
import { RestaurantReservationsService } from './restaurant-reservations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthRequest } from '../auth/interfaces/auth-request.interface';
import { Req } from '@nestjs/common';

@Controller('restaurant/reservations')
export class RestaurantReservationsController {
  constructor(private readonly reservationsService: RestaurantReservationsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createReservationDto: any) {
    return this.reservationsService.create(createReservationDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMyBookings(@Req() req: AuthRequest) {
    const userId = req.user.userId;
    const phoneNumber = req.user.phoneNumber;
    return this.reservationsService.findByUser(userId, phoneNumber);
  }

  @Get()
  findAll(
    @Query('partnerId') partnerId: string,
    @Query('branchId') branchId: string,
    @Query('date') date: string,
  ) {
    if ((partnerId || branchId) && date) {
      return this.reservationsService.findAll(date, branchId, partnerId);
    }
    return [];
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateReservationDto: any) {
    return this.reservationsService.update(id, updateReservationDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.reservationsService.updateStatus(id, status);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reservationsService.remove(id);
  }
}
