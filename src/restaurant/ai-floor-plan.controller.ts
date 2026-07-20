import { Controller, Post, Body, UseGuards, InternalServerErrorException } from '@nestjs/common';
import { AiFloorPlanService } from './ai-floor-plan.service';
import { RestaurantFloorsService } from './restaurant-floors.service';
import { RestaurantTablesService } from './restaurant-tables.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Types } from 'mongoose';

@Controller('restaurant/ai-floor-plan')
export class AiFloorPlanController {
  constructor(
    private readonly aiService: AiFloorPlanService,
    private readonly floorsService: RestaurantFloorsService,
    private readonly tablesService: RestaurantTablesService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('generate')
  async generateFromImage(
    @Body() body: { image: string; branchId: string; partnerId: string; floorName?: string }
  ) {
    const { image, branchId, partnerId, floorName } = body;
    
    if (!image) {
      throw new InternalServerErrorException('Image is required');
    }

    try {
      // 1. Ask Gemini to analyze the image
      const aiData = await this.aiService.generateFloorPlanFromImage(image);

      // 2. Map AI output to our application elements schema
      // Gemini returns generic elements. We map them to our IDs.
      const parsedElements = (aiData.elements || []).map((el: any, index: number) => ({
        id: `ai_element_${index}_${Date.now()}`,
        type: el.type || 'wall',
        x: Math.round(el.x || 0),
        y: Math.round(el.y || 0),
        width: Math.round(el.width || 40),
        height: Math.round(el.height || 40),
        rotation: el.rotation || 0,
        color: el.color || '#475569',
        text: el.text || ''
      }));

      // 3. Create the new Floor in DB
      const newFloorId = new Types.ObjectId();
      const floorDto = {
        _id: newFloorId,
        partnerId,
        branchId,
        name: floorName || 'AI Generated Plan',
        dimensions: { width: 800, height: 600 },
        elements: parsedElements,
        areas: [],
        order: 0,
        isActive: true,
      };
      
      const createdFloor = await this.floorsService.create(floorDto);

      // 4. Create Tables based on AI output
      const tables = aiData.tables || [];
      const tablePromises = tables.map((t: any, idx: number) => {
        return this.tablesService.create({
          partnerId,
          branchId,
          floorId: newFloorId.toString(),
          tableNumber: t.tableNumber || `T${idx + 1}`,
          capacity: t.capacity || 2,
          minCapacity: 1,
          shape: t.shape || 'square',
          position: t.position || { x: 0, y: 0 },
          size: t.size || { width: 80, height: 80 },
          rotation: t.rotation || 0,
          status: 'available',
          location: 'indoor',
          isVip: false,
        });
      });

      await Promise.all(tablePromises);

      // 5. Return success and new floor info
      return {
        success: true,
        floor: createdFloor,
        message: 'Floor plan successfully generated from image.'
      };
    } catch (error) {
      console.error('AI Generate Error:', error);
      throw new InternalServerErrorException(error.message || 'Failed to generate floor plan');
    }
  }
}
