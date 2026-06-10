import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Partner } from '../../partners/schemas/partner.schema';

export type BranchDocument = Branch & Document;

export class GalleryImage {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  category: string; // e.g. 'interior', 'exterior', 'food', 'events'
}

export class Address {
  @Prop()
  line1: string;

  @Prop()
  country: string;

  @Prop()
  city: string;

  @Prop()
  zipCode: string;
}

export class WorkingHour {
  @Prop()
  weekday: number; // 0-6

  @Prop()
  openTime: string; // "HH:mm"

  @Prop()
  closeTime: string; // "HH:mm"
}

export class BreakTime {
  @Prop()
  weekday: number; // 0-6

  @Prop()
  startTime: string; // "HH:mm"

  @Prop()
  endTime: string; // "HH:mm"
}

export class Location {
  @Prop()
  latitude: number;

  @Prop()
  longitude: number;
}

@Schema({ timestamps: true })
export class Branch {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Partner', required: true })
  partnerId: Partner;

  @Prop({ type: Address, required: true })
  address: Address;

  @Prop({ type: [String], default: [], validate: [(val: string[]) => val.length <= 4, '{PATH} exceeds the limit of 4'] })
  phoneNumbers: string[];

  @Prop({ type: [WorkingHour], default: [] })
  workingHours: WorkingHour[];

  @Prop({ type: [BreakTime], default: [] })
  breaks: BreakTime[];

  @Prop({ type: Location })
  location: Location;

  @Prop({ type: [GalleryImage], default: [] })
  gallery: GalleryImage[];
}

export const BranchSchema = SchemaFactory.createForClass(Branch);
