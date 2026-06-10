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

  @Get('user')
  async getUserNotifications(
    @Req() req: AuthRequest,
  ): Promise<Notification[]> {
    return this.notificationsService.findByUser(req.user.userId);
  }

  @Patch('user/read-all')
  async markAllUserAsRead(
    @Req() req: AuthRequest,
  ): Promise<{ success: boolean }> {
    await this.notificationsService.markAllAsReadForUser(req.user.userId);
    return { success: true };
  }

  @Patch('user/:id/read')
  async markUserAsRead(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ): Promise<Notification | null> {
    return this.notificationsService.markAsReadForUser(id, req.user.userId);
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
