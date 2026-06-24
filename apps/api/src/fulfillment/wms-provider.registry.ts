export interface WmsProviderProfile {
  id: string;
  name: string;
  regions: string[];
  skuVelocity: 'low' | 'medium' | 'high';
  notes: string;
}

export const WMS_PROVIDER_REGISTRY: WmsProviderProfile[] = [
  {
    id: 'manual',
    name: 'Manual fulfillment',
    regions: ['EC', 'LATAM'],
    skuVelocity: 'low',
    notes: 'In-house pick/pack/ship without external WMS.',
  },
  {
    id: 'redpack',
    name: 'Redpack Ecuador',
    regions: ['EC'],
    skuVelocity: 'medium',
    notes: 'Regional 3PL for Ecuador last-mile and warehousing.',
  },
  {
    id: 'shipbob',
    name: 'ShipBob',
    regions: ['US', 'CA', 'EU'],
    skuVelocity: 'high',
    notes: 'Global 3PL for high-velocity SKUs and international expansion.',
  },
  {
    id: 'amazon_fba',
    name: 'Amazon FBA',
    regions: ['US', 'EU', 'LATAM'],
    skuVelocity: 'high',
    notes: 'Marketplace fulfillment for Amazon channel listings.',
  },
];
