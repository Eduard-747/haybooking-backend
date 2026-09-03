import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { PartnersService } from './partners.service';
import { Partner } from './schemas/partner.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthRequest } from '../auth/interfaces/auth-request.interface';

@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: AuthRequest): Promise<Partner | null> {
    return this.partnersService.findByUserId(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/all')
  async findAllAdmin(@Req() req: AuthRequest): Promise<Partner[]> {
    if (req.user.role !== 'super_admin') {
      throw new UnauthorizedException('Only super_admin can access this');
    }
    return this.partnersService.findAllAdmin();
  }

  @Get()
  async findAll(
    @Query('q') query?: string,
    @Query('category') category?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ): Promise<Partner[]> {
    return this.partnersService.findAll({
      query,
      category,
      limit: limit ? parseInt(limit, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/status')
  async updateStatus(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body('status') status: string,
  ): Promise<Partner | null> {
    if (req.user.role !== 'super_admin') {
      throw new UnauthorizedException('Only super_admin can update status');
    }
    return this.partnersService.update(id, { status });
  }

  // Must come before :id to avoid treating "slug" as an ObjectId
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string): Promise<Partner | null> {
    return this.partnersService.findBySlug(slug);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Partner | null> {
    return this.partnersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateData: any,
  ): Promise<Partner | null> {
    return this.partnersService.update(id, updateData);
  }
}
