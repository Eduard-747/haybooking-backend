import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(
    partnerId: string,
    title: string,
    message: string,
    type: string,
  ): Promise<Notification> {
    const newNotification = new this.notificationModel({
      partnerId,
      title,
      message,
      type,
    });
    return newNotification.save();
  }

  async findByPartner(partnerId: string): Promise<Notification[]> {
    return this.notificationModel
      .find({ partnerId } as any)
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  async markAsRead(
    id: string,
    partnerId: string,
  ): Promise<Notification | null> {
    return this.notificationModel
      .findOneAndUpdate(
        { _id: id, partnerId } as any,
        { read: true },
        { new: true },
      )
      .exec();
  }

  async markAllAsRead(partnerId: string): Promise<void> {
    await this.notificationModel
      .updateMany({ partnerId, read: false } as any, { read: true })
      .exec();
  }
}
