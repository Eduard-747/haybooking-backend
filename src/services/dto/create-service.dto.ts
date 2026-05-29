import { IsString, IsNumber, IsOptional, IsArray, Min } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  partnerId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsNumber()
  @Min(1)
  duration: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(1)
  scheduleInterval: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedBranches?: string[];
}
