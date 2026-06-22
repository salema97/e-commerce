export class RefundResponseDto {
  id!: string;
  orderId!: string;
  paymentId!: string | null;
  providerRefundId!: string | null;
  amount!: number;
  reason!: string;
  status!: string;
  type!: 'full' | 'partial';
  requestedById!: string | null;
  approvedById!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
