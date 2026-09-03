import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RestaurantReservation,
  RestaurantReservationDocument,
} from './schemas/reservation.schema';
import { Table, TableDocument } from './schemas/table.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RestaurantReservationsService {
  constructor(
    @InjectModel(RestaurantReservation.name)
    private reservationModel: Model<RestaurantReservationDocument>,
    @InjectModel(Table.name) private tableModel: Model<TableDocument>,
    private notificationsService: NotificationsService,
  ) {}

  async create(data: any): Promise<RestaurantReservation> {
    const rawDate = data.date;
    const dateStr = typeof rawDate === 'string' 
      ? (rawDate.includes('T') ? rawDate.split('T')[0] : rawDate)
      : rawDate.toISOString().split('T')[0];
      
    const startDate = new Date(`${dateStr}T00:00:00.000Z`);
    const endDate = new Date(`${dateStr}T23:59:59.999Z`);
    
    // Normalize date to midnight UTC for saving
    data.date = startDate;

    // Check if table is available
    const existingReservations = await this.reservationModel
      .find({
        tableId: data.tableId,
        status: { $in: ['confirmed', 'seated'] },
        $or: [
          {
            startTime: { $lt: data.endTime },
            endTime: { $gt: data.startTime },
          },
        ],
        date: {
          $gte: startDate,
          $lt: endDate,
        },
      })
      .exec();

    if (existingReservations.length > 0) {
      throw new BadRequestException(
        'Table is already reserved for this time slot',
      );
    }

    const createdReservation = new this.reservationModel(data);
    const saved = await createdReservation.save();
    
    // Notify Partner
    if (data.partnerId) {
      const formattedDateStr = data.date instanceof Date 
        ? data.date.toISOString().split('T')[0] 
        : String(data.date).split('T')[0];
      await this.notificationsService.create(
        data.partnerId,
        'New Booking Received',
        `A new reservation request has been submitted for ${formattedDateStr}.`,
        'booking_created',
      );
    }
    
    // Notify User
    if (data.userId) {
      await this.notificationsService.createForUser(
        data.userId,
        'Reservation Submitted',
        `Your reservation has been submitted to the restaurant and is pending confirmation.`,
        'booking_created',
      );
    }
    
    return saved;
  }

  async findAll(
    date: string,
    branchId?: string,
    partnerId?: string,
  ): Promise<RestaurantReservation[]> {
    try {
      const isValidObjectId = (id: any) => typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
      
      let startDate: Date;
      let endDate: Date;
      try {
        const queryDateStr = typeof date === 'string' 
          ? (date.includes('T') ? date.split('T')[0] : date)
          : new Date(date).toISOString().split('T')[0];

        startDate = new Date(`${queryDateStr}T00:00:00.000Z`);
        endDate = new Date(`${queryDateStr}T23:59:59.999Z`);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error('Invalid date');
        }
      } catch {
        const todayStr = new Date().toISOString().split('T')[0];
        startDate = new Date(`${todayStr}T00:00:00.000Z`);
        endDate = new Date(`${todayStr}T23:59:59.999Z`);
      }

      const filter: any = {
        date: {
          $gte: startDate,
          $lt: endDate,
        },
      };

      if (isValidObjectId(branchId)) {
        filter.branchId = branchId;
      } else if (isValidObjectId(partnerId)) {
        filter.partnerId = partnerId;
      } else {
        return [];
      }

      return await this.reservationModel
        .find(filter)
        .populate('tableId')
        .populate('userId', 'name surname firstName lastName email phoneNumber phone')
        .exec();
    } catch (err) {
      console.error('Error in RestaurantReservationsService.findAll:', err);
      return [];
    }
  }

  async findByUser(
    userId: string,
    phoneNumber?: string,
  ): Promise<RestaurantReservation[]> {
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

    return this.reservationModel
      .find(query)
      .populate('partnerId', 'businessName image')
      .populate('branchId', 'address phoneNumber')
      .populate('tableId')
      .sort({ date: -1, startTime: -1 })
      .exec();
  }

  async findOne(id: string): Promise<RestaurantReservation> {
    const reservation = await this.reservationModel
      .findById(id)
      .populate('tableId')
      .exec();
    if (!reservation) {
      throw new NotFoundException(`Reservation #${id} not found`);
    }
    return reservation;
  }

  async update(id: string, data: any): Promise<RestaurantReservation> {
    const updatedReservation = await this.reservationModel
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .populate('tableId')
      .exec();
    if (!updatedReservation) {
      throw new NotFoundException(`Reservation #${id} not found`);
    }
    return updatedReservation;
  }

  async updateStatus(
    id: string,
    status: string,
  ): Promise<RestaurantReservation> {
    const updatedReservation = await this.reservationModel
      .findByIdAndUpdate(id, { status }, { returnDocument: 'after' })
      .populate('tableId')
      .exec();
    if (!updatedReservation) {
      throw new NotFoundException(`Reservation #${id} not found`);
    }

    // Auto-update table status
    if (status === 'seated') {
      await this.tableModel
        .findByIdAndUpdate(updatedReservation.tableId, { status: 'occupied' })
        .exec();
    } else if (
      status === 'completed' ||
      status === 'cancelled' ||
      status === 'no_show'
    ) {
      // Only mark table available if there are no other active reservations for it right now
      // A robust implementation would check current time vs other reservations
      await this.tableModel
        .findByIdAndUpdate(updatedReservation.tableId, { status: 'available' })
        .exec();
    }

    // Notify User
    if (updatedReservation.userId) {
      let title = 'Reservation Updated';
      let message = `Your reservation status is now ${status}.`;
      let type = 'info';
      
      if (status === 'confirmed') {
        title = 'Booking Accepted';
        message = 'Your booking has been accepted by the business.';
        type = 'booking_accepted';
      } else if (status === 'rejected') {
        title = 'Booking Declined';
        message = 'Your booking has been declined by the business.';
        type = 'booking_declined';
      } else if (status === 'cancelled') {
        title = 'Booking Cancelled';
        message = 'Your booking has been cancelled.';
        type = 'booking_cancelled';
      } else if (status === 'completed') {
        title = 'Booking Completed';
        message = 'Your booking has been marked as completed. Thank you!';
        type = 'booking_completed';
      }
      
      await this.notificationsService.createForUser(
        updatedReservation.userId.toString(),
        title,
        message,
        type,
      );
    }

    return updatedReservation;
  }

  async reassignTable(id: string, newTableId: string, reason: string): Promise<RestaurantReservation> {
    const reservation = await this.reservationModel.findById(id).exec();
    if (!reservation) {
      throw new NotFoundException(`Reservation #${id} not found`);
    }
    
    // Verify new table is available
    const existingReservations = await this.reservationModel
      .find({
        tableId: newTableId as any,
        status: { $in: ['confirmed', 'seated'] },
        $or: [
          {
            startTime: { $lt: reservation.endTime },
            endTime: { $gt: reservation.startTime },
          },
        ],
        date: reservation.date,
      })
      .exec();

    if (existingReservations.length > 0) {
      throw new BadRequestException('Selected table is already reserved for this time slot');
    }
    
    const updatedReservation = await this.reservationModel
      .findByIdAndUpdate(id, { tableId: newTableId, reassignReason: reason }, { returnDocument: 'after' })
      .populate('tableId')
      .exec();
      
    if (!updatedReservation) {
      throw new NotFoundException(`Reservation #${id} could not be updated`);
    }
      
    if (updatedReservation.userId) {
      await this.notificationsService.createForUser(
        updatedReservation.userId.toString(),
        'Table Reassigned',
        `Your reservation has been reassigned to a different table. Reason: ${reason}`,
        'info',
      );
    }
    
    return updatedReservation;
  }

  async remove(id: string): Promise<RestaurantReservation> {
    const deletedReservation = await this.reservationModel
      .findByIdAndDelete(id)
      .exec();
    if (!deletedReservation) {
      throw new NotFoundException(`Reservation #${id} not found`);
    }
    return deletedReservation;
  }
}
