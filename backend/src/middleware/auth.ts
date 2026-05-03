import type { RequestHandler } from 'express';
import { getSupabaseAdmin } from '../services/supabase.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Verifica el JWT de Supabase enviado en `Authorization: Bearer <token>`.
 * En modo mock o sin Supabase configurado, asigna un user fijo.
 */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      req.userId = 'mock-user';
      return next();
    }
    const header = req.header('authorization');
    if (!header?.startsWith('Bearer ')) {
      const e: any = new Error('Missing Authorization header');
      e.status = 401;
      throw e;
    }
    const token = header.slice(7);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      const e: any = new Error('Invalid token');
      e.status = 401;
      throw e;
    }
    req.userId = data.user.id;
    next();
  } catch (err) {
    next(err);
  }
};
