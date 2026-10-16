import type { CookieOptions } from 'express';

type Session = {
  expiresAt: Date;
};

export const getCookieOptions = (session?: Session) => {
  const options: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };
  if (session) {
    options.expires = session.expiresAt;
  }
  return options;
};
