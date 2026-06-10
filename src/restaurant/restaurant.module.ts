import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Floor, FloorSchema } from './schemas/floor.schema';
import { Table, TableSchema } from './schemas/table.schema';
import { RestaurantReservation, RestaurantReservationSchema } from './schemas/reservation.schema';
import { MenuItem, MenuItemSchema } from './schemas/menu-item.schema';
import { RestaurantFloorsService } from './restaurant-floors.service';
import { RestaurantFloorsController } from './restaurant-floors.controller';
import { RestaurantTablesService } from './restaurant-tables.service';
import { RestaurantTablesController } from './restaurant-tables.controller';
import { RestaurantReservationsService } from './restaurant-reservations.service';
import { RestaurantReservationsController } from './restaurant-reservations.controller';
import { RestaurantMenuService } from './restaurant-menu.service';
import { RestaurantMenuController } from './restaurant-menu.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Floor.name, schema: FloorSchema },
      { name: Table.name, schema: TableSchema },
      { name: RestaurantReservation.name, schema: RestaurantReservationSchema },
      { name: MenuItem.name, schema: MenuItemSchema },
    ]),
  ],
  controllers: [
    RestaurantFloorsController,
    RestaurantTablesController,
    RestaurantReservationsController,
    RestaurantMenuController,
  ],
  providers: [
    RestaurantFloorsService,
    RestaurantTablesService,
    RestaurantReservationsService,
    RestaurantMenuService,
  ],
  exports: [
    RestaurantFloorsService,
    RestaurantTablesService,
    RestaurantReservationsService,
    RestaurantMenuService,
  ],
})
export class RestaurantModule {}
