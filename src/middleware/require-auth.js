import { getSessionUser } from '../services/sessions.js';
import { HttpError } from '../utils/http-error.js';

export async function requireAuth(req, res, next) {
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
