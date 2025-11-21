import type { JwtPayload } from 'jsonwebtoken';
import type { User } from '@prisma/client';

export interface DecodedToken extends JwtPayload {
  id: User['id'];
  role: User['role'];
  joinStatus: User['joinStatus'];
  isActive: boolean;
  name: string;
  apartmentId?: string; // Admin/User의 아파트 ID (SUPER_ADMIN은 없음)
}

export interface RefreshDto {
  userId: number;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface TokenDto {
  accessToken: string;
  refreshToken: string;
  expiryDate?: Date;
}

export interface TokenPayload {
  id: User['id'];
  role: User['role'];
  joinStatus: User['joinStatus'];
  isActive: boolean;
  apartmentId?: string; // Admin/User의 아파트 ID (SUPER_ADMIN은 없음)
}
