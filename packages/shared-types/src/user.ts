import type { Role } from './enums.js';

export interface User {
  id: string;
  email: string;
  role: Role;
  name?: string | null;
  phone?: string | null;
  stripeCustomerId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateUserDto = {
  email: string;
  password?: string;
  phone?: string;
  role?: Role;
  name?: string;
};

export type UpdateUserDto = Partial<CreateUserDto>;

export interface PublicUser {
  id: string;
  email: string;
  role: Role;
  phone?: string | null;
}

export type UserWithOrders = User & { orders?: unknown[] };
