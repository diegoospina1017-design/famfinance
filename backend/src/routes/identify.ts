import { Router } from 'express';
import { z } from 'zod';
import { analyzePlant } from '../services/aiClient.js';
import { nextWatering } from '../utils/nextWatering.js';

const router = Router();

const bodySchema = z.object({
  imageUrl: z.string().url(),
  nickname: z.string().min(1).max(80).optional(),
});

/**
 * POST /identify
 * Body: { imageUrl, nickname? }
 * Response: { analysis, suggestedNextWateringAt }
 *
 * Es un endpoint stateless: NO guarda en DB. El cliente decide si "Guardar
 * planta" después de ver el resultado.
 */
router.post('/', async (req, res, next) => {
  try {
    const body = bodySchema.parse(req.body);
    const analysis = await analyzePlant({ imageUrl: body.imageUrl });

    const suggestedNextWateringAt = nextWatering({
      baseDays: analysis.carePlan.wateringFrequencyDays,
      humidityPreference: analysis.carePlan.humidityPreference,
      lastWateredAt: new Date(),
    });

    res.json({ analysis, suggestedNextWateringAt: suggestedNextWateringAt.toISOString() });
  } catch (err) {
    next(err);
  }
});

export default router;
