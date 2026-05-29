import {
  IsString,
  IsOptional,
  IsDateString,
  IsIn,
  IsArray,
} from 'class-validator';

export class CreateBookingDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  partnerId: string;

  @IsString()
  branchId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceIds?: string[];

  @IsOptional()
  @IsString()
  specialistId?: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsString()
  guestName?: string;

  @IsOptional()
  @IsString()
  guestEmail?: string;

  @IsOptional()
  @IsString()
  guestPhone?: string;
}

export class UpdateBookingStatusDto {
  @IsIn(['pending', 'confirmed', 'declined', 'cancelled'])
  status: string;
}
