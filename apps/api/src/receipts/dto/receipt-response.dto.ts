export class ReceiptResponseDto {
  id!: string;
  orderId!: string;
  number!: string;
  url!: string | null;
  emailDelivered!: boolean;
  createdAt!: Date;
}
