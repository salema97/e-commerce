import type { Role } from './enums.js';

export interface User {
  id: string;
  clerkUserId: string;
  email: string;
  role: Role;
  phone?: string | null;
  stripeCustomerId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateUserDto = {
  clerkUserId: string;
  email: string;
  phone?: string;
  role?: Role;
};

export type UpdateUserDto = Partial<CreateUserDto>;

export interface PublicUser {
  id: string;
  email: string;
  role: Role;
  phone?: string | null;
}

export type UserWithOrders = User & { orders?: unknown[] };
