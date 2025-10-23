import request from 'supertest';
import app from '#core/app';
import crypto from 'crypto';

export const api = () => request(app);
export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

// TODO: 타입 맞춰서 추가 작성
