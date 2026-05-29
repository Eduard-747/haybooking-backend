import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export class NotificationPreferences {
  @Prop({ default: true })
  email: boolean;

  @Prop({ default: false })
  sms: boolean;

  @Prop({ default: true })
  push: boolean;
}

@Schema({ timestamps: true })
export class User {
  @Prop({
    required: true,
    enum: ['client', 'partner', 'admin', 'super_admin'],
    default: 'client',
  })
  role: string;

  @Prop({ required: true, unique: true })
  phoneNumber: string;

  @Prop({ required: false })
  passwordHash: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  surname: string;

  @Prop({ required: false, unique: true, sparse: true })
  email: string;

  @Prop({ required: false })
  googleId: string;

  @Prop({ required: false })
  image?: string;

  @Prop({ type: [String], default: [] })
  favorites: string[];

  @Prop({
    type: NotificationPreferences,
    default: () => new NotificationPreferences(),
  })
  notificationPreferences: NotificationPreferences;
}

export const UserSchema = SchemaFactory.createForClass(User);
