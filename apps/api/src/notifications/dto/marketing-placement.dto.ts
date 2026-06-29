import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  MinLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import {
  MarketingPlacementPlatform,
  MarketingPlacementSlot,
  MarketingPlacementType,
} from '@prisma/client';

const POPUP_SLOT = MarketingPlacementSlot.APP_LAUNCH;
const NON_POPUP_SLOTS: MarketingPlacementSlot[] = [
  MarketingPlacementSlot.HOME_HERO,
  MarketingPlacementSlot.STORE_TOP,
  MarketingPlacementSlot.STORE_INLINE,
];

@ValidatorConstraint({ name: 'slotTypeCompatibility', async: false })
export class SlotTypeCompatibilityConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as { type?: MarketingPlacementType; slot?: MarketingPlacementSlot };
    if (!obj.type || !obj.slot) {
      return true;
    }
    if (obj.type === MarketingPlacementType.POPUP) {
      return obj.slot === POPUP_SLOT;
    }
    return NON_POPUP_SLOTS.includes(obj.slot);
  }

  defaultMessage(): string {
    return 'POPUP must use APP_LAUNCH slot; BANNER and PROMO_STRIP cannot use APP_LAUNCH';
  }
}

@ValidatorConstraint({ name: 'dateWindow', async: false })
export class DateWindowConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const obj = args.object as { startsAt?: string; endsAt?: string };
    if (!obj.startsAt || !obj.endsAt) {
      return true;
    }
    return new Date(obj.endsAt).getTime() > new Date(obj.startsAt).getTime();
  }

  defaultMessage(): string {
    return 'endsAt must be after startsAt';
  }
}

export class CreateMarketingPlacementDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsEnum(MarketingPlacementType)
  type!: MarketingPlacementType;

  @IsEnum(MarketingPlacementSlot)
  @Validate(SlotTypeCompatibilityConstraint)
  slot!: MarketingPlacementSlot;

  @IsOptional()
  @IsEnum(MarketingPlacementPlatform)
  platform?: MarketingPlacementPlatform;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  body?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  ctaLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  ctaHref?: string;

  @IsOptional()
  @IsUUID()
  promotionId?: string;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsDateString()
  @Validate(DateWindowConstraint)
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  showOncePerSession?: boolean;

  @IsOptional()
  @IsBoolean()
  showOnceEver?: boolean;

  @IsOptional()
  @IsBoolean()
  dismissible?: boolean;
}

export class UpdateMarketingPlacementDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEnum(MarketingPlacementType)
  type?: MarketingPlacementType;

  @IsOptional()
  @IsEnum(MarketingPlacementSlot)
  @Validate(SlotTypeCompatibilityConstraint)
  slot?: MarketingPlacementSlot;

  @IsOptional()
  @IsEnum(MarketingPlacementPlatform)
  platform?: MarketingPlacementPlatform;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  body?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  imageUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  ctaLabel?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  ctaHref?: string | null;

  @IsOptional()
  @IsUUID()
  promotionId?: string | null;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string | null;

  @IsOptional()
  @IsDateString()
  @Validate(DateWindowConstraint)
  endsAt?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  showOncePerSession?: boolean;

  @IsOptional()
  @IsBoolean()
  showOnceEver?: boolean;

  @IsOptional()
  @IsBoolean()
  dismissible?: boolean;
}

export class ActivePlacementsQueryDto {
  @IsIn(['WEB', 'MOBILE'])
  platform!: 'WEB' | 'MOBILE';
}

export class AdminMarketingPlacementsQueryDto {
  @IsOptional()
  @IsEnum(MarketingPlacementType)
  type?: MarketingPlacementType;

  @IsOptional()
  @IsEnum(MarketingPlacementSlot)
  slot?: MarketingPlacementSlot;

  @IsOptional()
  @IsEnum(MarketingPlacementPlatform)
  platform?: MarketingPlacementPlatform;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
