// lib/sessionLib.ts
export const sessionOptions = {
  cookieName: 'auth-token',
  password: process.env.SESSION_SECRET || 'your-secret-key-here-change-in-production',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};