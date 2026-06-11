import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Partner } from '../../partners/schemas/partner.schema';
import { Branch } from '../../branches/schemas/branch.schema';
import { Floor } from './floor.schema';

export type TableDocument = Table & Document;

export class Position {
  @Prop({ required: true })
  x: number;

  @Prop({ required: true })
  y: number;
}

export class Size {
  @Prop({ required: true })
  width: number;

  @Prop({ required: true })
  height: number;
}

@Schema({ timestamps: true })
export class Table {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Partner', required: true })
  partnerId: Partner;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Branch', required: true })
  branchId: Branch;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Floor', required: true })
  floorId: Floor;

  @Prop({ required: true })
  tableNumber: string;

  @Prop({ required: true })
  capacity: number;

  @Prop({ required: true, default: 1 })
  minCapacity: number;

  @Prop({
    required: true,
    enum: ['round', 'square', 'rectangular', 'oval', 'banquet', 'custom'],
    default: 'square',
  })
  shape: string;

  @Prop({ type: Position, required: true })
  position: Position;

  @Prop({ type: Size, required: true })
  size: Size;

  @Prop({ required: true, default: 0 })
  rotation: number;

  @Prop({
    required: true,
    enum: [
      'available',
      'reserved',
      'occupied',
      'cleaning',
      'out_of_service',
      'blocked',
    ],
    default: 'available',
  })
  status: string;

  @Prop({ required: true, enum: ['indoor', 'outdoor'], default: 'indoor' })
  location: string;

  @Prop({ required: true, default: false })
  isVip: boolean;

  @Prop({ required: false })
  areaId: string;

  @Prop({ required: false })
  notes: string;

  @Prop({ required: true, default: true })
  isActive: boolean;
}

export const TableSchema = SchemaFactory.createForClass(Table);
