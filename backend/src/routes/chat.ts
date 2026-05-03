import { Router } from 'express';
import { z } from 'zod';
import { answerPlantQuestion } from '../services/aiClient.js';

const router = Router();

const plantSchema = z.object({
  commonName: z.string().min(1),
  scientificName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  lastHealth: z.enum(['green', 'yellow', 'red']).nullable().optional(),
  wateringFrequencyDays: z.number().int().nullable().optional(),
  light: z.string().nullable().optional(),
  temperatureMinC: z.number().nullable().optional(),
  temperatureMaxC: z.number().nullable().optional(),
  humidityPreference: z.number().int().nullable().optional(),
  substrate: z.string().nullable().optional(),
  fertilizer: z.string().nullable().optional(),
  recentDiagnosisSummary: z.string().nullable().optional(),
});

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000),
});

const bodySchema = z.object({
  plant: plantSchema,
  history: z.array(messageSchema).max(20).default([]),
  question: z.string().min(1).max(1000),
});

/**
 * POST /chat
 * Body: { plant, history, question }
 * Response: { answer }
 */
router.post('/', async (req, res, next) => {
  try {
    const body = bodySchema.parse(req.body);
    const answer = await answerPlantQuestion(body);
    res.json({ answer });
  } catch (err) {
    next(err);
  }
});

export default router;
