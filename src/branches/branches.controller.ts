import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BranchesService } from './branches.service';
import { Branch } from './schemas/branch.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateBranchDto } from './dto/create-branch.dto';
import type { AuthRequest } from '../auth/interfaces/auth-request.interface';

@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() body: CreateBranchDto,
    @Req() req: AuthRequest,
  ): Promise<Branch> {
    return this.branchesService.create({
      ...body,
      partnerId: body.partnerId || req.user.partnerId,
    });
  }

  @Get()
  async findByPartner(
    @Query('partnerId') partnerId?: string,
  ): Promise<Branch[]> {
    if (partnerId) {
      return this.branchesService.findByPartner(partnerId);
    }
    return this.branchesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Branch | null> {
    return this.branchesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<CreateBranchDto>,
  ): Promise<Branch | null> {
    return this.branchesService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Branch | null> {
    return this.branchesService.remove(id);
  }
}
