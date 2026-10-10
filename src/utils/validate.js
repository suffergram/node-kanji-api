import { HttpError } from './http-error.js';

export function validate(schema, data) {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0].message);
  }
  return parsed.data;
}
