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
} from '@nestjs/common';
import { SpecialistsService } from './specialists.service';
import { Specialist } from './schemas/specialist.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSpecialistDto } from './dto/create-specialist.dto';

@Controller('specialists')
export class SpecialistsController {
  constructor(private readonly specialistsService: SpecialistsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: CreateSpecialistDto): Promise<Specialist> {
    return this.specialistsService.create(body);
  }

  @Get()
  async findByPartner(
    @Query('partnerId') partnerId: string,
  ): Promise<Specialist[]> {
    return this.specialistsService.findByPartner(partnerId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Specialist | null> {
    return this.specialistsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<CreateSpecialistDto>,
  ): Promise<Specialist | null> {
    return this.specialistsService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Specialist | null> {
    return this.specialistsService.remove(id);
  }
}
