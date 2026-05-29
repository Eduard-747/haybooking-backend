import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { PartnersService } from '../partners/partners.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private partnersService: PartnersService,
    private notificationsService: NotificationsService,
  ) {}

  async create(createBookingDto: any): Promise<Booking> {
    const data = { ...createBookingDto };
    // Strip optional ObjectId fields if they aren't valid 24-char hex strings
    const objectIdRegex = /^[a-fA-F0-9]{24}$/;
    if (data.specialistId && !objectIdRegex.test(data.specialistId)) {
      delete data.specialistId;
    }
    if (data.serviceIds && Array.isArray(data.serviceIds)) {
      data.serviceIds = data.serviceIds.filter(
        (id: any) => typeof id === 'string' && objectIdRegex.test(id),
      );
    }

    if (data.partnerId) {
      const partner = await this.partnersService.findOne(data.partnerId);
      if (partner?.autoAcceptBookings) {
        data.status = 'confirmed';
      }
    }

    // Overlap validation
    if (data.specialistId && data.startTime && data.endTime) {
      const overlapping = await this.bookingModel.findOne({
        specialistId: data.specialistId,
        status: { $in: ['pending', 'confirmed'] },
        $and: [
          { startTime: { $lt: data.endTime } },
          { endTime: { $gt: data.startTime } }
        ]
      });

      if (overlapping) {
        throw new BadRequestException('The selected time slot is already booked for this specialist.');
      }
    }

    const createdBooking = new this.bookingModel(data);
    const savedBooking = await createdBooking.save();

    // Trigger Notification and simulated SMS
    if (data.partnerId) {
      const guestName = data.guestName ? data.guestName : 'A client';
      await this.notificationsService.create(
        data.partnerId,
        'New Booking Received',
        `${guestName} has requested a new appointment.`,
        'booking_created'
      );
      console.log(`[SIMULATED SMS to super admin]: New booking received from ${guestName}.`);
    }

    return savedBooking;
  }

  async findByUser(userId: string, phoneNumber?: string): Promise<Booking[]> {
    const objectIdRegex = /^[a-fA-F0-9]{24}$/;
    const query: any = { $or: [] };

    if (userId && objectIdRegex.test(userId)) {
      query.$or.push({ userId });
    }

    if (phoneNumber) {
      query.$or.push({ guestPhone: phoneNumber });
    }

    if (query.$or.length === 0) {
      return [];
    }

    // Auto-complete logic for user queries
    // Find all confirmed bookings in the past
    const pastConfirmed = await this.bookingModel.find({
      $and: [
        query,
        { status: 'confirmed' },
        { endTime: { $lt: new Date().toISOString() } },
      ],
    });

    if (pastConfirmed.length > 0) {
      // For each past confirmed, check if its partner has auto-complete enabled
      for (const booking of pastConfirmed) {
        if (booking.partnerId) {
          const partner = await this.partnersService.findOne(
            booking.partnerId.toString(),
          );
          if (partner?.autoCompleteBookings) {
            await this.bookingModel.updateOne(
              { _id: booking._id },
              { status: 'completed' },
            );
          }
        }
      }
    }

    return this.bookingModel
      .find(query)
      .populate('partnerId', 'businessName image')
      .populate('specialistId', 'name image')
      .populate('serviceIds', 'name duration price image')
      .populate('serviceId', 'name duration price image')
      .populate('branchId', 'address phoneNumber')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByPartner(
    partnerId: string,
    branchId?: string,
  ): Promise<Booking[]> {
    const partner = await this.partnersService.findOne(partnerId);

    // Auto-complete logic
    if (partner?.autoCompleteBookings) {
      const autocompleteQuery: any = {
        partnerId,
        status: 'confirmed',
        endTime: { $lt: new Date().toISOString() },
      };
      if (branchId) autocompleteQuery.branchId = branchId;

      await this.bookingModel.updateMany(
        autocompleteQuery,
        { status: 'completed' },
      );
    }

    const query: any = { partnerId };
    if (branchId) query.branchId = branchId;

    console.log("findByPartner query:", query);

    return this.bookingModel
      .find(query)
      .populate('userId', 'name surname phoneNumber email')
      .populate('specialistId', 'name')
      .populate('serviceIds', 'name duration price')
      .populate('serviceId', 'name duration price')
      .populate('branchId', 'address phoneNumber')
      .sort({ startTime: 1 })
      .exec();
  }

  async updateStatus(id: string, status: string): Promise<Booking | null> {
    const updated = await this.bookingModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .populate('userId', 'name surname')
      .exec();

    if (updated && status === 'cancelled') {
      const clientName = updated.guestName || (updated.userId as any)?.name || 'A client';
      await this.notificationsService.create(
        updated.partnerId as any,
        'Booking Cancelled',
        `${clientName} has cancelled their appointment.`,
        'booking_cancelled'
      );
      console.log(`[SIMULATED SMS to super admin]: Booking cancelled by ${clientName}.`);
    }

    return updated;
  }

  async getAnalytics(partnerId: string, branchId?: string): Promise<any> {
    const query: any = { partnerId };
    if (branchId) query.branchId = branchId;

    console.log("getAnalytics query:", query);

    const allBookings = await this.bookingModel.find(query).exec();
    const total = allBookings.length;
    const pending = allBookings.filter((b) => b.status === 'pending').length;
    const confirmed = allBookings.filter(
      (b) => b.status === 'confirmed',
    ).length;
    const cancelled = allBookings.filter(
      (b) => b.status === 'cancelled',
    ).length;
    const declined = allBookings.filter((b) => b.status === 'declined').length;
    return { total, pending, confirmed, cancelled, declined };
  }

  async getBookedSlots(specialistId: string, date: string): Promise<string[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await this.bookingModel
      .find({
        specialistId,
        status: { $in: ['pending', 'confirmed'] },
        startTime: {
          $gte: startOfDay.toISOString(),
          $lte: endOfDay.toISOString(),
        },
      } as any)
      .exec();

    // Convert startTime to HH:mm string in local time (or UTC based on how it's stored)
    // Assuming the frontend sends time as HH:mm and it gets converted to Date using local TZ
    // For simplicity, we just extract the hours and minutes from the ISO string's Date object
    return bookings.map((b) => {
      const d = new Date(b.startTime);
      const hh = d.getHours().toString().padStart(2, '0');
      const mm = d.getMinutes().toString().padStart(2, '0');
      return `${hh}:${mm}`;
    });
  }
}
