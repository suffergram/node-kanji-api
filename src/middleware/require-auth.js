const { getSessionUser } = require('../services/sessions');
const { HttpError } = require('../utils/http-error');

async function requireAuth(req, res, next) {
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

module.exports = {
  requireAuth,
};
