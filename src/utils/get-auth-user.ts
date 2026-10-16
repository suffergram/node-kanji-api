import type { Request } from 'express';
import type { PublicUser } from './user.js';
import { HttpError } from './http-error.js';

// Returns the user set by requireAuth; throws 401 if the route forgot it
export function getAuthUser(req: Request): PublicUser {
  if (!req.user) {
    throw new HttpError(401, 'Unauthorized');
  }

  return req.user;
}
