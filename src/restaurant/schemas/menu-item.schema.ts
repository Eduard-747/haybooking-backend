import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Partner } from '../../partners/schemas/partner.schema';
import { Branch } from '../../branches/schemas/branch.schema';

export type MenuItemDocument = MenuItem & Document;

@Schema({ timestamps: true })
export class MenuItem {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Partner', required: true })
  partnerId: Partner;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Branch', required: false })
  branchId: Branch; // Optional, can be global to partner

  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  category: string; // e.g., 'Appetizers', 'Main Courses', 'Drinks'

  @Prop({ required: false })
  image: string; // URL

  @Prop({ required: true, default: true })
  isAvailable: boolean;
}

export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);
