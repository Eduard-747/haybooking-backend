import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Partner } from '../../partners/schemas/partner.schema';
import { Branch } from '../../branches/schemas/branch.schema';
import { Service } from '../../services/schemas/service.schema';
import { Specialist } from '../../specialists/schemas/specialist.schema';

export type BookingDocument = Booking & Document;

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  userId: User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Partner', required: true })
  partnerId: Partner;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Branch', required: true })
  branchId: Branch;

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Service' }],
    required: false,
  })
  serviceIds: Service[];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Service',
    required: false,
  })
  serviceId?: Service;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Specialist',
    required: false,
  })
  specialistId: Specialist;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({
    required: true,
    enum: ['pending', 'confirmed', 'declined', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Prop({ required: false })
  guestName?: string;

  @Prop({ required: false })
  guestEmail?: string;

  @Prop({ required: false })
  guestPhone?: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

// Add compound index on Booking (branchId, specialistId, startTime) as per PRD
BookingSchema.index({ branchId: 1, specialistId: 1, startTime: 1 });
