import type { JwtPayload } from 'jsonwebtoken';
import type { User } from '@prisma/client';

export interface DecodedToken extends JwtPayload {
  id: User['id'];
  role: User['role'];
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

export interface UpdateTokenDto extends TokenDto {
  userId: number;
}

export interface TokenPayload {
  id: string;
  role: string;
  joinStatus: string;
  isActive: boolean;
}
