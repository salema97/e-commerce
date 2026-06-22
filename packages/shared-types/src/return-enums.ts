export type ReturnStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'INSPECTION'
  | 'RESOLVED'
  | 'RESOLUTION_PENDING_CREDIT_NOTE'
  | 'CLOSED';

export type RefundMethod = 'ORIGINAL_PAYMENT' | 'STORE_CREDIT' | 'EXCHANGE';

export type ReturnItemCondition = 'NEW' | 'USED' | 'DAMAGED';

export type CreditNoteStatus = 'DRAFT' | 'SUBMITTED' | 'AUTHORIZED' | 'REJECTED' | 'FAILED';
