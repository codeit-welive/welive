import type { JwtPayload } from 'jsonwebtoken';
import type { User } from '@prisma/client';

export interface DecodedToken extends JwtPayload {
  id: User['id'];
  role: User['role'];
  joinStatus: User['joinStatus'];
  isActive: boolean;
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
}
