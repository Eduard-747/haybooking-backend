import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MenuFileDocument = MenuFile & Document;

@Schema({ timestamps: true })
export class MenuFile {
  @Prop({ required: true })
  partnerId: string;

  @Prop()
  branchId?: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  format: string;

  @Prop({ required: true })
  size: string;

  @Prop({ required: true })
  fileData: string;
}

export const MenuFileSchema = SchemaFactory.createForClass(MenuFile);
