export enum SriJobName {
  ISSUE_INVOICE = 'issue-invoice',
  ISSUE_CREDIT_NOTE = 'issue-credit-note',
  RECONCILE_DOCUMENT = 'reconcile-document',
}

export interface IssueInvoiceJobData {
  orderId: string;
}

export interface IssueCreditNoteJobData {
  creditNoteId: string;
}

export interface ReconcileDocumentJobData {
  documentType: string;
  documentId: string;
}

export type SriQueueJobData =
  | IssueInvoiceJobData
  | IssueCreditNoteJobData
  | ReconcileDocumentJobData;
