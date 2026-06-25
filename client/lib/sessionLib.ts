// lib/sessionLib.ts
import { SessionOptions } from 'iron-session';

export const ironSessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'your-super-secret-key-here-change-in-production-at-least-32-chars',
  cookieName: 'civil-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS attacks
    sameSite: 'strict', // CSRF protection
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/', // Cookie available site-wide
  },
  ttl: 60 * 60 * 24 * 7, // 7 days in seconds
};