import { Router } from 'express';
import { z } from 'zod';
import { analyzePlant } from '../services/aiClient.js';
import { nextWatering } from '../utils/nextWatering.js';

const router = Router();

const bodySchema = z
  .object({
    imageUrl: z.string().url().optional(),
    imageBase64: z.string().min(100).optional(),
    imageMediaType: z
      .enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
      .optional(),
    nickname: z.string().min(1).max(80).optional(),
  })
  .refine(d => !!d.imageUrl || !!d.imageBase64, {
    message: 'Either imageUrl or imageBase64 is required',
  });

/**
 * POST /identify
 * Body: { imageUrl?, imageBase64?, imageMediaType?, nickname? }
 * Response: { analysis, suggestedNextWateringAt }
 */
router.post('/', async (req, res, next) => {
  try {
    const body = bodySchema.parse(req.body);
    const analysis = await analyzePlant({
      imageUrl: body.imageUrl,
      imageBase64: body.imageBase64,
      imageMediaType: body.imageMediaType,
    });

    const suggestedNextWateringAt = nextWatering({
      baseDays: analysis.carePlan.wateringFrequencyDays,
      humidityPreference: analysis.carePlan.humidityPreference,
      lastWateredAt: new Date(),
    });

    res.json({
      analysis,
      suggestedNextWateringAt: suggestedNextWateringAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
