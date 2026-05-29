import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Partner } from '../../partners/schemas/partner.schema';
import { Branch } from '../../branches/schemas/branch.schema';
import { Service } from '../../services/schemas/service.schema';

export type SpecialistDocument = Specialist & Document;

@Schema({ timestamps: true })
export class Specialist {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Partner', required: true })
  partnerId: Partner;

  @Prop({ required: true })
  name: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Branch' }] })
  assignedBranches: Branch[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Service' }] })
  assignedServices: Service[];

  @Prop({ required: false })
  image?: string;
}

export const SpecialistSchema = SchemaFactory.createForClass(Specialist);
