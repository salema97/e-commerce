export type MarketingPlacementType = 'POPUP' | 'BANNER' | 'PROMO_STRIP';

export type MarketingPlacementSlot = 'APP_LAUNCH' | 'HOME_HERO' | 'STORE_TOP' | 'STORE_INLINE';

export type MarketingPlacementPlatform = 'WEB' | 'MOBILE' | 'ALL';

export type ActiveMarketingPlatform = 'WEB' | 'MOBILE';

export interface MarketingPlacement {
  id: string;
  name: string;
  type: MarketingPlacementType;
  slot: MarketingPlacementSlot;
  platform: MarketingPlacementPlatform;
  title: string;
  body?: string | null;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  promotionId?: string | null;
  priority: number;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive: boolean;
  contentVersion: number;
  showOncePerSession: boolean;
  showOnceEver: boolean;
  dismissible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingPlacementPublic {
  id: string;
  type: MarketingPlacementType;
  slot: MarketingPlacementSlot;
  title: string;
  body?: string | null;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  promotionId?: string | null;
  priority: number;
  contentVersion: number;
  showOncePerSession: boolean;
  showOnceEver: boolean;
  dismissible: boolean;
}

export interface SlotActivePlacements {
  popup?: MarketingPlacementPublic;
  banners: MarketingPlacementPublic[];
  promoStrips: MarketingPlacementPublic[];
}

export type ActivePlacementsResponse = Record<MarketingPlacementSlot, SlotActivePlacements>;

export interface CreateMarketingPlacementDto {
  name: string;
  type: MarketingPlacementType;
  slot: MarketingPlacementSlot;
  platform?: MarketingPlacementPlatform;
  title: string;
  body?: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
  promotionId?: string;
  priority?: number;
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
  showOncePerSession?: boolean;
  showOnceEver?: boolean;
  dismissible?: boolean;
}

export interface UpdateMarketingPlacementDto {
  name?: string;
  type?: MarketingPlacementType;
  slot?: MarketingPlacementSlot;
  platform?: MarketingPlacementPlatform;
  title?: string;
  body?: string | null;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  promotionId?: string | null;
  priority?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean;
  showOncePerSession?: boolean;
  showOnceEver?: boolean;
  dismissible?: boolean;
}

export interface ActivePlacementsQuery {
  platform: ActiveMarketingPlatform;
}

export interface AdminMarketingPlacementsQuery {
  type?: MarketingPlacementType;
  slot?: MarketingPlacementSlot;
  platform?: MarketingPlacementPlatform;
  isActive?: boolean;
}
