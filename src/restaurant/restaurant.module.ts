import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Floor, FloorSchema } from './schemas/floor.schema';
import { Table, TableSchema } from './schemas/table.schema';
import {
  RestaurantReservation,
  RestaurantReservationSchema,
} from './schemas/reservation.schema';
import { MenuItem, MenuItemSchema } from './schemas/menu-item.schema';
import { MenuFile, MenuFileSchema } from './schemas/menu-file.schema';
import { RestaurantFloorsService } from './restaurant-floors.service';
import { RestaurantFloorsController } from './restaurant-floors.controller';
import { RestaurantTablesService } from './restaurant-tables.service';
import { RestaurantTablesController } from './restaurant-tables.controller';
import { RestaurantReservationsService } from './restaurant-reservations.service';
import { RestaurantReservationsController } from './restaurant-reservations.controller';
import { RestaurantMenuService } from './restaurant-menu.service';
import { RestaurantMenuController } from './restaurant-menu.controller';
import { AiFloorPlanService } from './ai-floor-plan.service';
import { AiFloorPlanController } from './ai-floor-plan.controller';
import { RestaurantMenuFileController } from './restaurant-menu-file.controller';
import { RestaurantMenuFileService } from './restaurant-menu-file.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Floor.name, schema: FloorSchema },
      { name: Table.name, schema: TableSchema },
      { name: RestaurantReservation.name, schema: RestaurantReservationSchema },
      { name: MenuItem.name, schema: MenuItemSchema },
      { name: MenuFile.name, schema: MenuFileSchema },
    ]),
    NotificationsModule,
    ConfigModule,
  ],
  controllers: [
    RestaurantFloorsController,
    RestaurantTablesController,
    RestaurantReservationsController,
    RestaurantMenuController,
    RestaurantMenuFileController,
    AiFloorPlanController,
  ],
  providers: [
    RestaurantFloorsService,
    RestaurantTablesService,
    RestaurantReservationsService,
    RestaurantMenuService,
    RestaurantMenuFileService,
    AiFloorPlanService,
  ],
  exports: [
    RestaurantFloorsService,
    RestaurantTablesService,
    RestaurantReservationsService,
    RestaurantMenuService,
    RestaurantMenuFileService,
    AiFloorPlanService,
  ],
})
export class RestaurantModule { }
