import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { plantAnalysisPrompt } from '../prompts/plantAnalysis.js';
import { mockAnalysis } from '../mocks/analysis.js';

// ---------------------------------------------------------------------------
// Schema de salida estricto. Funciona igual para Claude y Gemini.
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

export interface AnalyzeOpts {
  /** URL pública de la imagen (Supabase Storage, etc.) */
  imageUrl?: string;
  /** O bien la imagen como base64 puro (sin prefijo data:) */
  imageBase64?: string;
  /** Tipo de imagen cuando se usa imageBase64 */
  imageMediaType?: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
  history?: {
    nickname?: string | null;
    pastDiagnoses?: { date: string; summary: string }[];
    negativeFeedback?: { recommendationId: string; comment?: string | null }[];
  };
}

// ---------------------------------------------------------------------------
// Selección de proveedor. Prioridad:
//   1. AI_PROVIDER explícito ("gemini" | "anthropic" | "mock")
//   2. Si hay GEMINI_API_KEY  → gemini
//   3. Si hay ANTHROPIC_API_KEY → anthropic
//   4. Sino → mock
// ---------------------------------------------------------------------------
type Provider = 'gemini' | 'anthropic' | 'mock';

function resolveProvider(): Provider {
  const explicit = process.env.AI_PROVIDER?.toLowerCase();
  if (explicit === 'gemini' || explicit === 'anthropic' || explicit === 'mock') {
    return explicit;
  }
  if (process.env.USE_MOCK_AI === 'true') return 'mock';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  return 'mock';
}

// ---------------------------------------------------------------------------
// Resuelve la imagen a { data: base64, mediaType } a partir de URL o base64.
// ---------------------------------------------------------------------------
type MediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

export async function resolveImage(opts: AnalyzeOpts): Promise<{
  data: string;
  mediaType: MediaType;
}> {
  if (opts.imageBase64) {
    return {
      data: opts.imageBase64,
      mediaType: opts.imageMediaType ?? 'image/jpeg',
    };
  }
  if (!opts.imageUrl) {
    throw new Error('No image provided (imageUrl or imageBase64 required)');
  }
  return fetchImageAsBase64(opts.imageUrl);
}

export async function fetchImageAsBase64(url: string): Promise<{
  data: string;
  mediaType: MediaType;
}> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const contentType = res.headers.get('content-type') ?? 'image/jpeg';
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
  const mediaType = (allowed.find(t => contentType.includes(t.split('/')[1])) ?? 'image/jpeg') as MediaType;
  const buf = Buffer.from(await res.arrayBuffer());
  return { data: buf.toString('base64'), mediaType };
}

// ---------------------------------------------------------------------------
// Cliente Anthropic
// ---------------------------------------------------------------------------
let cachedAnthropic: Anthropic | null | undefined;

function getAnthropicClient(): Anthropic | null {
  if (cachedAnthropic !== undefined) return cachedAnthropic;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    cachedAnthropic = null;
    return null;
  }
  cachedAnthropic = new Anthropic({ apiKey });
  return cachedAnthropic;
}

async function analyzeWithAnthropic(opts: AnalyzeOpts): Promise<Analysis> {
  const client = getAnthropicClient();
  if (!client) throw new Error('ANTHROPIC_API_KEY no está configurado');

  const { data, mediaType } = await resolveImage(opts);
  const userText = plantAnalysisPrompt.user(opts.history);

  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? 'claude-opus-4-7',
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

// ---------------------------------------------------------------------------
// Llamada principal — despacha al proveedor configurado.
// ---------------------------------------------------------------------------
export async function analyzePlant(opts: AnalyzeOpts): Promise<Analysis> {
  const provider = resolveProvider();
  // eslint-disable-next-line no-console
  console.log(`[ai] using provider: ${provider}`);

  if (provider === 'mock') {
    await new Promise(r => setTimeout(r, 600));
    return mockAnalysis(opts.imageUrl);
  }

  if (provider === 'gemini') {
    // import dinámico para no romper si la dep no está instalada localmente
    const { analyzeWithGemini } = await import('./geminiClient.js');
    return analyzeWithGemini(opts);
  }

  return analyzeWithAnthropic(opts);
}

function extractJson(text: string): unknown {
  // Acepta tanto JSON puro como JSON dentro de ```json ... ```
  const fenced = /```json\s*([\s\S]*?)```/i.exec(text);
  const raw = fenced ? fenced[1] : text;
  return JSON.parse(raw.trim());
}

// ---------------------------------------------------------------------------
// Chat — preguntas en lenguaje natural sobre una planta específica.
// ---------------------------------------------------------------------------
export interface PlantChatContext {
  commonName: string;
  scientificName?: string | null;
  description?: string | null;
  lastHealth?: 'green' | 'yellow' | 'red' | null;
  wateringFrequencyDays?: number | null;
  light?: string | null;
  temperatureMinC?: number | null;
  temperatureMaxC?: number | null;
  humidityPreference?: number | null;
  substrate?: string | null;
  fertilizer?: string | null;
  recentDiagnosisSummary?: string | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatOpts {
  plant: PlantChatContext;
  history: ChatMessage[];
  question: string;
}

export const CHAT_SYSTEM = `Sos un asistente experto en cuidado de plantas de interior y jardín casero. Respondé en español rioplatense, en tono cálido y cercano, máximo 4-6 oraciones. Basate en el contexto de la planta del usuario que te paso al inicio. Si la pregunta no tiene relación con plantas, redirigí amablemente. Nunca inventes datos médicos peligrosos para mascotas — si te preguntan toxicidad, sé prudente y recomendá consultar al veterinario.`;

export function buildPlantContextText(plant: PlantChatContext): string {
  const lines: string[] = [
    `Planta: ${plant.commonName}${plant.scientificName ? ` (${plant.scientificName})` : ''}`,
  ];
  if (plant.description) lines.push(`Descripción: ${plant.description}`);
  if (plant.lastHealth) lines.push(`Estado de salud actual: ${plant.lastHealth}`);
  if (plant.wateringFrequencyDays) lines.push(`Riego cada ${plant.wateringFrequencyDays} días`);
  if (plant.light) lines.push(`Luz: ${plant.light}`);
  if (plant.temperatureMinC != null && plant.temperatureMaxC != null) {
    lines.push(`Temperatura ideal: ${plant.temperatureMinC}°C – ${plant.temperatureMaxC}°C`);
  }
  if (plant.humidityPreference != null) lines.push(`Humedad preferida: ${plant.humidityPreference}%`);
  if (plant.substrate) lines.push(`Sustrato: ${plant.substrate}`);
  if (plant.fertilizer) lines.push(`Fertilizante: ${plant.fertilizer}`);
  if (plant.recentDiagnosisSummary) lines.push(`Último diagnóstico: ${plant.recentDiagnosisSummary}`);
  return lines.join('\n');
}

async function chatWithAnthropic(opts: ChatOpts): Promise<string> {
  const client = getAnthropicClient();
  if (!client) throw new Error('ANTHROPIC_API_KEY no está configurado');

  const contextText = buildPlantContextText(opts.plant);
  const messages = [
    { role: 'user' as const, content: `Contexto de mi planta:\n${contextText}` },
    { role: 'assistant' as const, content: 'Perfecto, ya tengo el contexto. ¿Qué querés saber?' },
    ...opts.history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: opts.question },
  ];

  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-opus-4-7',
    max_tokens: 600,
    system: CHAT_SYSTEM,
    messages,
  });

  const block = message.content.find(b => b.type === 'text');
  if (!block || block.type !== 'text') throw new Error('AI response had no text block');
  return block.text.trim();
}

export async function answerPlantQuestion(opts: ChatOpts): Promise<string> {
  const provider = resolveProvider();
  // eslint-disable-next-line no-console
  console.log(`[ai/chat] using provider: ${provider}`);

  if (provider === 'mock') {
    await new Promise(r => setTimeout(r, 400));
    return `(Respuesta simulada) Sobre tu ${opts.plant.commonName}: recordá luz indirecta brillante y chequear el sustrato antes de regar.`;
  }

  if (provider === 'gemini') {
    const { chatWithGemini } = await import('./geminiClient.js');
    return chatWithGemini(opts);
  }

  return chatWithAnthropic(opts);
}
