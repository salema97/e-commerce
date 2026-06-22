export interface Address {
  id: string;
  userId?: string | null;
  label?: string | null;
  recipientName: string;
  street: string;
  city: string;
  state?: string | null;
  country: string;
  zipCode?: string | null;
  phone?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateAddressDto = Omit<Address, 'id' | 'createdAt' | 'updatedAt' | 'userId'> & {
  userId?: string;
};

export type UpdateAddressDto = Partial<CreateAddressDto>;

export interface OrderAddress {
  recipientName: string;
  street: string;
  city: string;
  state?: string;
  country: string;
  zipCode?: string;
  phone?: string;
}
