import type { Role } from './enums.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  phone: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}
