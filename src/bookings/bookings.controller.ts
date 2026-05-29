import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Booking } from './schemas/booking.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateBookingDto,
  UpdateBookingStatusDto,
} from './dto/create-booking.dto';
import type { AuthRequest } from '../auth/interfaces/auth-request.interface';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async create(@Body() createBookingDto: CreateBookingDto): Promise<Booking> {
    return this.bookingsService.create(createBookingDto);
  }

  @Get('availability')
  async getAvailability(
    @Query('specialistId') specialistId: string,
    @Query('date') date: string,
  ): Promise<{ bookedSlots: string[] }> {
    if (!specialistId || !date) {
      return { bookedSlots: [] };
    }
    const bookedSlots = await this.bookingsService.getBookedSlots(
      specialistId,
      date,
    );
    return { bookedSlots };
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  async getMyBookings(@Req() req: AuthRequest): Promise<Booking[]> {
    return this.bookingsService.findByUser(
      req.user.userId,
      req.user.phoneNumber,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('partner')
  async getPartnerBookings(
    @Query('partnerId') partnerId: string,
    @Query('branchId') branchId?: string,
  ): Promise<Booking[]> {
    return this.bookingsService.findByPartner(partnerId, branchId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('analytics')
  async getAnalytics(
    @Query('partnerId') partnerId: string,
    @Query('branchId') branchId?: string,
  ): Promise<any> {
    return this.bookingsService.getAnalytics(partnerId, branchId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateBookingStatusDto,
  ): Promise<Booking | null> {
    return this.bookingsService.updateStatus(id, body.status);
  }
}
