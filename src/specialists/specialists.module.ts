import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SpecialistsService } from './specialists.service';
import { SpecialistsController } from './specialists.controller';
import { Specialist, SpecialistSchema } from './schemas/specialist.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Specialist.name, schema: SpecialistSchema },
    ]),
  ],
  providers: [SpecialistsService],
  controllers: [SpecialistsController],
  exports: [MongooseModule],
})
export class SpecialistsModule {}
