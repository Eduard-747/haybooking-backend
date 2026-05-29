import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PartnersService } from './partners.service';
import { PartnersController } from './partners.controller';
import { Partner, PartnerSchema } from './schemas/partner.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Partner.name, schema: PartnerSchema }]),
  ],
  providers: [PartnersService],
  controllers: [PartnersController],
  exports: [MongooseModule, PartnersService],
})
export class PartnersModule {}
