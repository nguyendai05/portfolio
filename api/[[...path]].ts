import type { VercelRequest, VercelResponse } from '@vercel/node';
import { routeRequest } from '../server/router';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return routeRequest(req, res);
}
