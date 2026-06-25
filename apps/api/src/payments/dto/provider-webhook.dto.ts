import { IsString, IsOptional, IsNumber, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class KushkiWebhookDto {
  @IsString()
  @IsOptional()
  transactionReference?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsObject()
  @IsOptional()
  @Type(() => Object)
  metadata?: Record<string, unknown>;
}

export class PayPhoneWebhookDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsNumber()
  @IsOptional()
  transactionStatus?: number;

  @IsString()
  @IsOptional()
  message?: string;
}

export class MercadoPagoWebhookDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  data_id?: string;

  @IsString()
  @IsOptional()
  type?: string;
}

export class PlaceToPayWebhookDto {
  @IsString()
  @IsOptional()
  requestId?: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
