import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RestaurantReservation, RestaurantReservationDocument } from './schemas/reservation.schema';
import { Table, TableDocument } from './schemas/table.schema';

@Injectable()
export class RestaurantReservationsService {
  constructor(
    @InjectModel(RestaurantReservation.name) private reservationModel: Model<RestaurantReservationDocument>,
    @InjectModel(Table.name) private tableModel: Model<TableDocument>,
  ) {}

  async create(data: any): Promise<RestaurantReservation> {
    // Check if table is available
    const existingReservations = await this.reservationModel.find({
      tableId: data.tableId,
      status: { $in: ['confirmed', 'seated'] },
      $or: [
        { startTime: { $lt: data.endTime }, endTime: { $gt: data.startTime } },
      ],
      date: data.date,
    }).exec();

    if (existingReservations.length > 0) {
      throw new BadRequestException('Table is already reserved for this time slot');
    }

    const createdReservation = new this.reservationModel(data);
    return createdReservation.save();
  }

  async findAll(date: string, branchId?: string, partnerId?: string): Promise<RestaurantReservation[]> {
    const queryDate = new Date(date);
    const filter: any = {
      date: {
        $gte: new Date(queryDate.setHours(0, 0, 0, 0)),
        $lt: new Date(queryDate.setHours(23, 59, 59, 999)),
      }
    };
    if (branchId) filter.branchId = branchId;
    else if (partnerId) filter.partnerId = partnerId;

    return this.reservationModel
      .find(filter)
      .populate('tableId')
      .exec();
  }

  async findByUser(userId: string, phoneNumber?: string): Promise<RestaurantReservation[]> {
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
    const reservation = await this.reservationModel.findById(id).populate('tableId').exec();
    if (!reservation) {
      throw new NotFoundException(`Reservation #${id} not found`);
    }
    return reservation;
  }

  async update(id: string, data: any): Promise<RestaurantReservation> {
    const updatedReservation = await this.reservationModel
      .findByIdAndUpdate(id, data, { new: true })
      .populate('tableId')
      .exec();
    if (!updatedReservation) {
      throw new NotFoundException(`Reservation #${id} not found`);
    }
    return updatedReservation;
  }

  async updateStatus(id: string, status: string): Promise<RestaurantReservation> {
    const updatedReservation = await this.reservationModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .populate('tableId')
      .exec();
    if (!updatedReservation) {
      throw new NotFoundException(`Reservation #${id} not found`);
    }
    
    // Auto-update table status
    if (status === 'seated') {
        await this.tableModel.findByIdAndUpdate(updatedReservation.tableId, { status: 'occupied' }).exec();
    } else if (status === 'completed' || status === 'cancelled' || status === 'no_show') {
        // Only mark table available if there are no other active reservations for it right now
        // A robust implementation would check current time vs other reservations
        await this.tableModel.findByIdAndUpdate(updatedReservation.tableId, { status: 'available' }).exec();
    }

    return updatedReservation;
  }

  async remove(id: string): Promise<RestaurantReservation> {
    const deletedReservation = await this.reservationModel.findByIdAndDelete(id).exec();
    if (!deletedReservation) {
      throw new NotFoundException(`Reservation #${id} not found`);
    }
    return deletedReservation;
  }
}
