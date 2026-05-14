import { Router } from 'express';
import { getSupabaseAdmin } from '../services/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * GET /plants/:id
 * Devuelve la planta + sus diagnósticos + sus fotos + sus recordatorios.
 * Útil para PlantDetailScreen.
 */
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return res.status(503).json({ error: { message: 'DB not configured' } });
    }
    const plantId = req.params.id;

    const [plant, diagnoses, photos, reminders, notes] = await Promise.all([
      supabase.from('plants').select('*').eq('id', plantId).eq('user_id', req.userId).single(),
      supabase
        .from('diagnoses')
        .select('*')
        .eq('plant_id', plantId)
        .order('created_at', { ascending: false }),
      supabase
        .from('plant_photos')
        .select('*')
        .eq('plant_id', plantId)
        .order('taken_at', { ascending: false }),
      supabase.from('reminders').select('*').eq('plant_id', plantId),
      supabase.from('notes').select('*').eq('plant_id', plantId).order('created_at', { ascending: false }),
    ]);

    if (plant.error || !plant.data) {
      return res.status(404).json({ error: { message: 'Plant not found' } });
    }

    res.json({
      plant: plant.data,
      diagnoses: diagnoses.data ?? [],
      photos: photos.data ?? [],
      reminders: reminders.data ?? [],
      notes: notes.data ?? [],
    });
  } catch (err) {
    next(err);
  }
});

export default router;
