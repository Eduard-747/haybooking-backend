import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  UseGuards,
  Req,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Notification } from './schemas/notification.schema';
import type { AuthRequest } from '../auth/interfaces/auth-request.interface';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Query('partnerId') partnerId: string,
  ): Promise<Notification[]> {
    return this.notificationsService.findByPartner(partnerId);
  }

  @Patch('read-all')
  async markAllAsRead(
    @Query('partnerId') partnerId: string,
  ): Promise<{ success: boolean }> {
    await this.notificationsService.markAllAsRead(partnerId);
    return { success: true };
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Query('partnerId') partnerId: string,
  ): Promise<Notification | null> {
    return this.notificationsService.markAsRead(id, partnerId);
  }

  @Post('admin/send')
  async sendAdminMessage(
    @Req() req: AuthRequest,
    @Body('partnerId') partnerId: string,
    @Body('title') title: string,
    @Body('message') message: string,
  ): Promise<Notification> {
    if (req.user.role !== 'super_admin') {
      throw new UnauthorizedException('Only super_admin can send messages');
    }
    return this.notificationsService.create(partnerId, title, message, 'info');
  }
}
