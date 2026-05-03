import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { plantAnalysisPrompt } from '../prompts/plantAnalysis.js';
import { mockAnalysis } from '../mocks/analysis.js';

// ---------------------------------------------------------------------------
// Schema de salida estricto. Si Claude devuelve algo distinto, falla y mockeamos.
// ---------------------------------------------------------------------------
export const issueSchema = z.object({
  key: z.enum([
    'yellow-leaves',
    'spots',
    'pests',
    'overwatering',
    'underwatering',
    'fungus',
    'sunburn',
    'nutrient-deficiency',
    'general-stress',
    'other',
  ]),
  label: z.string(),
  detail: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
});

export const recommendationSchema = z.object({
  id: z.string(),
  label: z.string(),
  dueInDays: z.number().int().min(0).max(365),
});

export const analysisSchema = z.object({
  identification: z.object({
    commonName: z.string(),
    scientificName: z.string().nullable(),
    confidence: z.number().min(0).max(1),
    description: z.string(),
  }),
  diagnosis: z.object({
    severity: z.enum(['low', 'medium', 'high']),
    health: z.enum(['green', 'yellow', 'red']),
    issues: z.array(issueSchema),
    summary: z.string(),
    lowConfidenceWarning: z.boolean(),
    lowConfidenceReason: z.string().nullable(),
  }),
  carePlan: z.object({
    wateringFrequencyDays: z.number().int().min(1).max(60),
    light: z.string(),
    temperatureMinC: z.number(),
    temperatureMaxC: z.number(),
    humidityPreference: z.number().int().min(0).max(100),
    substrate: z.string(),
    fertilizer: z.string(),
    next7Days: z.array(recommendationSchema),
    avoid: z.array(z.string()),
  }),
});

export type Analysis = z.infer<typeof analysisSchema>;

// ---------------------------------------------------------------------------
// Cliente
// ---------------------------------------------------------------------------
let cached: Anthropic | null | undefined;

function getClient(): Anthropic | null {
  if (cached !== undefined) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    cached = null;
    return null;
  }
  cached = new Anthropic({ apiKey });
  return cached;
}

function isMockMode(): boolean {
  return process.env.USE_MOCK_AI === 'true' || !process.env.ANTHROPIC_API_KEY;
}

// ---------------------------------------------------------------------------
// Carga la imagen como base64 para enviársela a Claude.
// ---------------------------------------------------------------------------
async function fetchImageAsBase64(url: string): Promise<{
  data: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
}> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const contentType = res.headers.get('content-type') ?? 'image/jpeg';
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
  const mediaType = (allowed.find(t => contentType.includes(t.split('/')[1])) ?? 'image/jpeg') as
    | 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
  const buf = Buffer.from(await res.arrayBuffer());
  return { data: buf.toString('base64'), mediaType };
}

// ---------------------------------------------------------------------------
// Llamada principal
// ---------------------------------------------------------------------------
export interface AnalyzeOpts {
  imageUrl: string;
  history?: {
    nickname?: string | null;
    pastDiagnoses?: { date: string; summary: string }[];
    negativeFeedback?: { recommendationId: string; comment?: string | null }[];
  };
}

export async function analyzePlant(opts: AnalyzeOpts): Promise<Analysis> {
  if (isMockMode()) {
    // pequeño delay para que se vea el loading state
    await new Promise(r => setTimeout(r, 600));
    return mockAnalysis(opts.imageUrl);
  }

  const client = getClient();
  if (!client) return mockAnalysis(opts.imageUrl);

  const { data, mediaType } = await fetchImageAsBase64(opts.imageUrl);
  const userText = plantAnalysisPrompt.user(opts.history);

  const message = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1500,
    system: plantAnalysisPrompt.system,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
          { type: 'text', text: userText },
        ],
      },
    ],
  });

  const textBlock = message.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('AI response had no text block');
  }
  const json = extractJson(textBlock.text);
  const parsed = analysisSchema.safeParse(json);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('AI schema mismatch', parsed.error.flatten());
    throw new Error('AI response did not match expected schema');
  }
  return parsed.data;
}

function extractJson(text: string): unknown {
  // Acepta tanto JSON puro como JSON dentro de ```json ... ```
  const fenced = /```json\s*([\s\S]*?)```/i.exec(text);
  const raw = fenced ? fenced[1] : text;
  return JSON.parse(raw.trim());
}
