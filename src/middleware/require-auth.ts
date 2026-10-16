import type { NextFunction, Request, Response } from 'express';
import { getSessionUser } from '../services/sessions.js';
import { HttpError } from '../utils/http-error.js';

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { cookies } = req;

  if (!cookies.sid) {
    throw new HttpError(401, 'Unauthorized');
  }

  const user = await getSessionUser(cookies.sid);

  if (!user) {
    throw new HttpError(401, 'Unauthorized');
  }

  req.user = user;
  next();
}
