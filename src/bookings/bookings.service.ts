import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { PartnersService } from '../partners/partners.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BranchesService } from '../branches/branches.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private partnersService: PartnersService,
    private notificationsService: NotificationsService,
    private branchesService: BranchesService,
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

    // Past time slot validation
    if (data.startTime) {
      const bookingStart = new Date(data.startTime);
      if (bookingStart < new Date()) {
        throw new BadRequestException('Cannot book a past time slot.');
      }
    }

    // Branch break overlap validation
    if (data.branchId && data.startTime && data.endTime) {
      const branch = await this.branchesService.findOne(data.branchId);
      if (branch && branch.breaks && branch.breaks.length > 0) {
        const bookingStart = new Date(data.startTime);
        const bookingEnd = new Date(data.endTime);
        const dayOfWeek = bookingStart.getDay();
        const dailyBreaks = branch.breaks.filter(
          (b: any) => b.weekday === dayOfWeek,
        );

        for (const b of dailyBreaks) {
          const breakStart = new Date(bookingStart);
          const [sh, sm] = b.startTime.split(':');
          breakStart.setHours(parseInt(sh, 10), parseInt(sm, 10), 0, 0);

          const breakEnd = new Date(bookingStart);
          const [eh, em] = b.endTime.split(':');
          breakEnd.setHours(parseInt(eh, 10), parseInt(em, 10), 0, 0);

          if (bookingStart < breakEnd && bookingEnd > breakStart) {
            throw new BadRequestException(
              'The selected time overlaps with a branch break period.',
            );
          }
        }
      }
    }

    // Overlap validation
    if (data.specialistId && data.startTime && data.endTime) {
      const overlapping = await this.bookingModel.findOne({
        specialistId: data.specialistId,
        status: { $in: ['pending', 'confirmed'] },
        $and: [
          { startTime: { $lt: data.endTime } },
          { endTime: { $gt: data.startTime } },
        ],
      });

      if (overlapping) {
        throw new BadRequestException(
          'The selected time slot is already booked for this specialist.',
        );
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
        'booking_created',
      );
      console.log(
        `[SIMULATED SMS to super admin]: New booking received from ${guestName}.`,
      );
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
            if (booking.userId) {
              await this.notificationsService.createForUser(
                booking.userId.toString(),
                'Booking Completed',
                'Your booking has been marked as completed. Thank you!',
                'booking_completed',
              );
            }
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

      const bookingsToComplete = await this.bookingModel.find(autocompleteQuery);

      await this.bookingModel.updateMany(autocompleteQuery, {
        status: 'completed',
      });

      for (const b of bookingsToComplete) {
        if (b.userId) {
          await this.notificationsService.createForUser(
            b.userId.toString(),
            'Booking Completed',
            'Your booking has been marked as completed. Thank you!',
            'booking_completed',
          );
        }
      }
    }

    const query: any = { partnerId };
    if (branchId) query.branchId = branchId;

    console.log('findByPartner query:', query);

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

    if (updated) {
      if (status === 'cancelled') {
        const clientName =
          updated.guestName || (updated.userId as any)?.name || 'A client';
        await this.notificationsService.create(
          updated.partnerId as any,
          'Booking Cancelled',
          `${clientName} has cancelled their appointment.`,
          'booking_cancelled',
        );
        console.log(
          `[SIMULATED SMS to super admin]: Booking cancelled by ${clientName}.`,
        );

        if (updated.userId) {
          await this.notificationsService.createForUser(
            (updated.userId as any)._id.toString(),
            'Booking Cancelled',
            'Your booking has been cancelled.',
            'booking_cancelled',
          );
        }
      } else if (status === 'confirmed') {
        if (updated.userId) {
          await this.notificationsService.createForUser(
            (updated.userId as any)._id.toString(),
            'Booking Accepted',
            'Your booking has been accepted by the business.',
            'booking_accepted',
          );
        }
      } else if (status === 'completed') {
        if (updated.userId) {
          await this.notificationsService.createForUser(
            (updated.userId as any)._id.toString(),
            'Booking Completed',
            'Your booking has been marked as completed. Thank you!',
            'booking_completed',
          );
        }
      } else if (status === 'declined') {
        if (updated.userId) {
          await this.notificationsService.createForUser(
            (updated.userId as any)._id.toString(),
            'Booking Declined',
            'Your booking has been declined by the business.',
            'booking_declined',
          );
        }
      }
    }

    return updated;
  }

  async getAnalytics(partnerId: string, branchId?: string): Promise<any> {
    const query: any = { partnerId };
    if (branchId) query.branchId = branchId;

    console.log('getAnalytics query:', query);

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

  async getBookedSlots(
    specialistId: string,
    branchId: string,
    date: string,
  ): Promise<string[]> {
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
    const bookedSlots = bookings.map((b) => {
      const d = new Date(b.startTime);
      const hh = d.getHours().toString().padStart(2, '0');
      const mm = d.getMinutes().toString().padStart(2, '0');
      return `${hh}:${mm}`;
    });

    // Add branch breaks to booked slots
    if (branchId) {
      const branch = await this.branchesService.findOne(branchId);
      if (branch && branch.breaks && branch.breaks.length > 0) {
        const dayOfWeek = startOfDay.getDay();
        const dailyBreaks = branch.breaks.filter(
          (b: any) => b.weekday === dayOfWeek,
        );

        // We check every hour from 00:00 to 23:00 to see if it overlaps with a break
        for (const b of dailyBreaks) {
          const [sh, sm] = b.startTime.split(':').map(Number);
          const [eh, em] = b.endTime.split(':').map(Number);

          const breakStartMins = sh * 60 + sm;
          const breakEndMins = eh * 60 + em;

          for (let hour = 0; hour < 24; hour++) {
            const slotStartMins = hour * 60;
            const slotEndMins = hour * 60 + 60; // Assuming 1-hour slots for the calendar representation

            // If the slot overlaps with the break, mark it as booked
            if (slotStartMins < breakEndMins && slotEndMins > breakStartMins) {
              bookedSlots.push(`${hour.toString().padStart(2, '0')}:00`);
            }
          }
        }
      }
    }

    return Array.from(new Set(bookedSlots));
  }
}
