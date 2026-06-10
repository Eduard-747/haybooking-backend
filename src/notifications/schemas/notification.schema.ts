import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Partner } from '../../partners/schemas/partner.schema';
import { User } from '../../users/schemas/user.schema';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Partner', required: false })
  partnerId: Partner;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  userId: User;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({
    required: true,
    enum: [
      'booking_created',
      'booking_cancelled',
      'booking_accepted',
      'booking_completed',
      'booking_declined',
      'info'
    ],
    default: 'info',
  })
  type: string;

  @Prop({ default: false })
  read: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
