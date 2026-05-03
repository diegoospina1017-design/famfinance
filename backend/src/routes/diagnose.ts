import { Router } from 'express';
import { z } from 'zod';
import { analyzePlant } from '../services/aiClient.js';
import { getSupabaseAdmin } from '../services/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const bodySchema = z.object({
  plantId: z.string().uuid(),
  imageUrl: z.string().url(),
});

/**
 * POST /diagnose
 *
 * Re-diagnostica una planta ya guardada. Inyecta histórico + feedback
 * negativo previo en el prompt para mejorar la sugerencia.
 */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { plantId, imageUrl } = bodySchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    let history;
    if (supabase) {
      const [plantRes, diagRes, fbRes] = await Promise.all([
        supabase.from('plants').select('nickname').eq('id', plantId).single(),
        supabase
          .from('diagnoses')
          .select('summary, created_at')
          .eq('plant_id', plantId)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('feedback')
          .select('recommendation_id, comment')
          .eq('plant_id', plantId)
          .eq('helpful', false)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      history = {
        nickname: plantRes.data?.nickname ?? null,
        pastDiagnoses:
          diagRes.data?.map(d => ({
            date: new Date(d.created_at).toISOString().slice(0, 10),
            summary: d.summary ?? '',
          })) ?? [],
        negativeFeedback:
          fbRes.data?.map(f => ({
            recommendationId: f.recommendation_id,
            comment: f.comment ?? null,
          })) ?? [],
      };
    }

    const analysis = await analyzePlant({ imageUrl, history });

    if (supabase) {
      const { data: diagInsert } = await supabase
        .from('diagnoses')
        .insert({
          plant_id: plantId,
          photo_url: imageUrl,
          severity: analysis.diagnosis.severity,
          health: analysis.diagnosis.health,
          issues: analysis.diagnosis.issues,
          summary: analysis.diagnosis.summary,
          low_confidence: analysis.diagnosis.lowConfidenceWarning,
          recommended_actions: analysis.carePlan.next7Days,
          avoid: analysis.carePlan.avoid,
        })
        .select('id')
        .single();

      await supabase
        .from('plant_photos')
        .insert({ plant_id: plantId, url: imageUrl, diagnosis_id: diagInsert?.id ?? null });

      await supabase
        .from('plants')
        .update({ last_health: analysis.diagnosis.health })
        .eq('id', plantId);
    }

    res.json({ analysis });
  } catch (err) {
    next(err);
  }
});

export default router;
