import { Injectable, Logger } from '@nestjs/common';
import type { ReturnRequest, ReturnStatus } from '@prisma/client';

/**
 * No-op adapter for return-related notifications. Logs domain events so the
 * RMA flow can be wired to real email/WhatsApp providers in later phases
 * without changing the ReturnsService contract.
 */
@Injectable()
export class ReturnNotificationService {
  private readonly logger = new Logger(ReturnNotificationService.name);

  async onReturnRequested(req: ReturnRequest): Promise<void> {
    this.logger.log(
      { returnId: req.id, orderId: req.orderId },
      'NOTIFY: return requested (no-op)',
    );
  }

  async onReturnStatusChanged(
    req: ReturnRequest,
    from: ReturnStatus,
    to: ReturnStatus,
  ): Promise<void> {
    this.logger.log(
      { returnId: req.id, from, to },
      'NOTIFY: return status changed (no-op)',
    );
  }
}
