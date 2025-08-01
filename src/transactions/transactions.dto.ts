import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsIn,
} from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  categoryId: string;

  @IsDateString()
  @IsOptional()
  date?: string;
}

export class UpdateTransactionDto {
  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsDateString()
  @IsOptional()
  date?: string;
}

export class GetTransactionsFilterDto {
  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsIn(['income', 'expense'])
  @IsOptional()
  type?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
