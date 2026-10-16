import { type Response } from 'express';
import { HttpError } from './http-error.js';

export function send(res: Response, rows: unknown[]) {
  if (rows.length === 1) {
    res.json(rows[0]);
    return;
  }
  if (rows.length === 0) {
    throw new HttpError(404, 'Not Found');
  }

  res.json(rows);
}
