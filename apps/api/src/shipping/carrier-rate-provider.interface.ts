export interface CarrierRateAddress {
  country?: string;
  province?: string;
  city?: string;
  street?: string;
  zipCode?: string;
}

export interface CarrierRateParcel {
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
}

export interface CarrierRateQuoteInput {
  origin?: CarrierRateAddress;
  destination: CarrierRateAddress;
  subtotal: number;
  freeShipping?: boolean;
  parcel?: CarrierRateParcel;
}

export interface CarrierRateOption {
  provider: string;
  carrier: string;
  service: string;
  amount: number;
  currency: string;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

export interface CarrierRateQuoteResult {
  amount: number;
  zoneCode: string;
  zoneName: string;
  freeShippingApplied: boolean;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  provider: string;
  options?: CarrierRateOption[];
}

export abstract class CarrierRateProvider {
  abstract quote(input: CarrierRateQuoteInput): Promise<CarrierRateQuoteResult>;
}
