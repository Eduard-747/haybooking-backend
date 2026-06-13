import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Partner } from '../../partners/schemas/partner.schema';
import { Branch } from '../../branches/schemas/branch.schema';

export type FloorDocument = Floor & Document;

export class Point {
  @Prop({ required: true })
  x: number;

  @Prop({ required: true })
  y: number;
}

export class Area {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({
    required: true,
    enum: ['room', 'hall', 'terrace', 'vip', 'private', 'bar', 'other'],
  })
  type: string;

  @Prop({ required: false })
  x?: number;

  @Prop({ required: false })
  y?: number;

  @Prop({ required: false })
  width?: number;

  @Prop({ required: false })
  height?: number;

  @Prop({ type: [Point], default: [] })
  points: Point[];

  @Prop({ required: false })
  color?: string;
}

export class FloorElement {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  x: number;

  @Prop({ required: true })
  y: number;

  @Prop({ required: false })
  width?: number;

  @Prop({ required: false })
  height?: number;

  @Prop({ required: false })
  rotation?: number;

  @Prop({ required: false })
  color?: string;
}

export class Dimensions {
  @Prop({ required: true })
  width: number;

  @Prop({ required: true })
  height: number;
}

@Schema({ timestamps: true })
export class Floor {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Partner', required: true })
  partnerId: Partner;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Branch', required: true })
  branchId: Branch;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: 0 })
  order: number;

  @Prop({ type: Dimensions, required: true })
  dimensions: Dimensions;

  @Prop({ type: [Area], default: [] })
  areas: Area[];

  @Prop({ type: [FloorElement], default: [] })
  elements: FloorElement[];

  @Prop({ required: true, default: true })
  isActive: boolean;
}

export const FloorSchema = SchemaFactory.createForClass(Floor);
