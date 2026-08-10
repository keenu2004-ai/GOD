import jwt from 'jsonwebtoken';
import { UserSession } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET || process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !REFRESH_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET or REFRESH_SECRET environment variable is missing in production.');
  }
  console.warn('[SECURITY WARNING] JWT_SECRET or REFRESH_SECRET is not configured. Falling back to development defaults.');
}

const activeJwtSecret = JWT_SECRET || 'dev_jwt_secret_fallback_key';
const activeRefreshSecret = REFRESH_SECRET || 'dev_refresh_secret_fallback_key';

export function generateTokens(payload: UserSession) {
  const accessToken = jwt.sign(payload, activeJwtSecret, { expiresIn: '1h' });
  const refreshToken = jwt.sign(payload, activeRefreshSecret, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, activeJwtSecret) as UserSession;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, activeRefreshSecret) as UserSession;
  } catch (error) {
    return null;
  }
}

