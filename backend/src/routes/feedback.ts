import { Router } from 'express';
import { z } from 'zod';
import { getSupabaseAdmin } from '../services/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const bodySchema = z.object({
  plantId: z.string().uuid(),
  recommendationId: z.string().min(1).max(80),
  helpful: z.boolean(),
  comment: z.string().max(500).optional(),
});

/**
 * POST /feedback
 * Marca una recomendación como útil / no útil. La señal se inyecta en
 * el siguiente /diagnose de la misma planta.
 */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const body = bodySchema.parse(req.body);
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      // En modo mock: sólo confirmamos.
      return res.json({ ok: true, mock: true });
    }
    const { error } = await supabase.from('feedback').insert({
      user_id: req.userId,
      plant_id: body.plantId,
      recommendation_id: body.recommendationId,
      helpful: body.helpful,
      comment: body.comment ?? null,
    });
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
