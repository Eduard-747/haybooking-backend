import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateSpecialistDto {
  @IsString()
  partnerId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedBranches?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedServices?: string[];

  @IsOptional()
  @IsString()
  image?: string;
}
