import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type PartnerDocument = Partner & Document;

@Schema({ timestamps: true })
export class Partner {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: User;

  @Prop({ required: true })
  businessName: string;

  @Prop({ required: true })
  businessType: string;

  @Prop({ required: false })
  description: string;

  @Prop({ required: false })
  image: string;

  @Prop({ required: false, unique: true, sparse: true })
  slug: string;

  @Prop({ 
    required: true, 
    enum: ['pending', 'active', 'rejected'], 
    default: 'active' 
  })
  status: string;

  @Prop({ required: false })
  publicDescription: string;

  @Prop({ required: true, default: false })
  subscriptionStatus: boolean; // false = free, true = premium

  @Prop({ required: false, default: false })
  autoAcceptBookings: boolean;

  @Prop({ required: false, default: false })
  autoCompleteBookings: boolean;

  @Prop({ required: false, default: 'AMD' })
  currency: string;
}

export const PartnerSchema = SchemaFactory.createForClass(Partner);
