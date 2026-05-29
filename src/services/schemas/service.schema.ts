import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Partner } from '../../partners/schemas/partner.schema';
import { Branch } from '../../branches/schemas/branch.schema';

export type ServiceDocument = Service & Document;

@Schema({ timestamps: true })
export class Service {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Partner', required: true })
  partnerId: Partner;

  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  category: string;

  @Prop({ required: false })
  image: string;

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop({ required: true })
  duration: number; // in minutes

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  scheduleInterval: number; // in minutes

  @Prop({ required: false })
  description: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Branch' }] })
  assignedBranches: Branch[];
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
