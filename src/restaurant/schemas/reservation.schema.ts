import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Partner } from '../../partners/schemas/partner.schema';
import { Branch } from '../../branches/schemas/branch.schema';
import { Table } from './table.schema';
import { Floor } from './floor.schema';

export type RestaurantReservationDocument = RestaurantReservation & Document;

@Schema({ timestamps: true })
export class RestaurantReservation {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Partner', required: true })
  partnerId: Partner;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Branch', required: true })
  branchId: Branch;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Table', required: true })
  tableId: Table;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Floor', required: true })
  floorId: Floor;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  userId?: User;

  @Prop({ required: false })
  guestName?: string;

  @Prop({ required: false })
  guestPhone?: string;

  @Prop({ required: false })
  guestEmail?: string;

  @Prop({ required: true })
  partySize: number;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  startTime: string; // HH:mm

  @Prop({ required: true })
  endTime: string; // HH:mm

  @Prop({
    required: true,
    enum: ['confirmed', 'seated', 'completed', 'cancelled', 'no_show'],
    default: 'confirmed',
  })
  status: string;

  @Prop({ required: false })
  notes?: string;

  @Prop({
    required: true,
    enum: ['online', 'phone', 'walk_in'],
    default: 'online',
  })
  source: string;
}

export const RestaurantReservationSchema = SchemaFactory.createForClass(RestaurantReservation);
