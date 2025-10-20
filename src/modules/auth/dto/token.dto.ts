import type { JwtPayload } from 'jsonwebtoken';
import type { User } from '@prisma/client';

export interface DecodedToken extends JwtPayload {
  id: User['id'];
}

export interface RefreshDto {
  userId: number;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface AuthHeaderDto {
  authorization: string;
}

export interface TokenDto {
  accessToken: string;
  refreshToken: string;
  expiryDate?: Date;
}

export interface UpdateTokenDto extends TokenDto {
  userId: number;
}
