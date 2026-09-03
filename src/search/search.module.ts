import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { Partner, PartnerSchema } from '../partners/schemas/partner.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { Specialist, SpecialistSchema } from '../specialists/schemas/specialist.schema';
import { Branch, BranchSchema } from '../branches/schemas/branch.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Partner.name, schema: PartnerSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: Specialist.name, schema: SpecialistSchema },
      { name: Branch.name, schema: BranchSchema },
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
