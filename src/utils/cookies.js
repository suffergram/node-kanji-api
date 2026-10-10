export const getCookieOptions = (session) => {
  const options = {
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
