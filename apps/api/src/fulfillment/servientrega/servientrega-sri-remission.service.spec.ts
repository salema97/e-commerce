import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ServientregaSriRemissionService } from './servientrega-sri-remission.service.js';
import { SriSupplementaryService } from '../../invoices/sri/sri-supplementary.service.js';

describe('ServientregaSriRemissionService', () => {
  let service: ServientregaSriRemissionService;
  let supplementary: { issue: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    supplementary = { issue: vi.fn() };

    const module = await Test.createTestingModule({
      providers: [
        ServientregaSriRemissionService,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) =>
              key === 'SERVIENTREGA_SRI_REMISSION_ENABLED' ? 'true' : undefined,
            ),
          },
        },
        { provide: SriSupplementaryService, useValue: supplementary },
      ],
    }).compile();

    service = module.get(ServientregaSriRemissionService);
  });

  it('skips when feature flag is disabled', async () => {
    const module = await Test.createTestingModule({
      providers: [
        ServientregaSriRemissionService,
        {
          provide: ConfigService,
          useValue: { get: vi.fn(() => 'false') },
        },
        { provide: SriSupplementaryService, useValue: supplementary },
      ],
    }).compile();

    const disabled = module.get(ServientregaSriRemissionService);
    const result = await disabled.tryIssueForShipment({
      orderId: 'order-1',
      shipmentId: 'ship-1',
      guideNumber: '123456789',
      orderNumber: 'ORD-1',
    });

    expect(result.skipped).toBe(true);
    expect(supplementary.issue).not.toHaveBeenCalled();
  });

  it('issues guia 06 and returns result', async () => {
    supplementary.issue.mockResolvedValue({
      id: 'doc-1',
      documentType: '06',
      accessKey: 'key',
      status: 'AUTHORIZED',
      authorizationNumber: 'AUTH-1',
    });

    const result = await service.tryIssueForShipment({
      orderId: 'order-1',
      shipmentId: 'ship-1',
      guideNumber: '123456789',
      orderNumber: 'ORD-1',
    });

    expect(result.issued).toBe(true);
    expect(result.accessKey).toBe('key');
    expect(supplementary.issue).toHaveBeenCalledWith(
      expect.objectContaining({
        documentType: '06',
        shipmentId: 'ship-1',
        carrierGuideNumber: '123456789',
      }),
    );
  });

  it('returns error without throwing when SRI fails', async () => {
    supplementary.issue.mockRejectedValue(new Error('SRI rejected'));

    const result = await service.tryIssueForShipment({
      orderId: 'order-1',
      shipmentId: 'ship-1',
      guideNumber: '123456789',
      orderNumber: 'ORD-1',
    });

    expect(result.issued).toBe(false);
    expect(result.error).toContain('SRI rejected');
  });
});
