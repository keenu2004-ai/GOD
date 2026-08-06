import jwt from 'jsonwebtoken';
import { UserSession } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'theiakshi_enterprise_hrms_super_secret_jwt_key_2026';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'theiakshi_enterprise_hrms_refresh_secret_key_2026';

if (!process.env.JWT_SECRET) {
  console.warn('[SECURITY WARNING] JWT_SECRET environment variable is not set. Using default fallback.');
}

export function generateTokens(payload: UserSession) {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as UserSession;
  } catch (error) {
    return null;
  }
}

