import { HttpError } from './http-error.js';

export function send(res, content) {
  if (content.length === 1) content = content[0];
  if (content.length === 0) throw new HttpError(404, 'Not Found');

  res.json(content);
}
