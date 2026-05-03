import { GoogleGenerativeAI } from '@google/generative-ai';
import { plantAnalysisPrompt } from '../prompts/plantAnalysis.js';
import {
  analysisSchema,
  resolveImage,
  buildPlantContextText,
  CHAT_SYSTEM,
  type Analysis,
  type AnalyzeOpts,
  type ChatOpts,
} from './aiClient.js';

let cached: GoogleGenerativeAI | null | undefined;

function getClient(): GoogleGenerativeAI | null {
  if (cached !== undefined) return cached;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    cached = null;
    return null;
  }
  cached = new GoogleGenerativeAI(apiKey);
  return cached;
}

/**
 * Analiza una planta usando Google Gemini (multimodal).
 * Devuelve el mismo shape que la versión de Claude — el resto del código
 * no necesita cambiar nada.
 */
export async function analyzeWithGemini(opts: AnalyzeOpts): Promise<Analysis> {
  const client = getClient();
  if (!client) throw new Error('GEMINI_API_KEY no está configurado');

  const { data, mediaType } = await resolveImage(opts);
  const userText = plantAnalysisPrompt.user(opts.history);

  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: plantAnalysisPrompt.system,
    generationConfig: {
      // Forzamos JSON puro, sin texto antes ni después.
      responseMimeType: 'application/json',
      temperature: 0.4,
    },
  });

  const result = await model.generateContent([
    { inlineData: { data, mimeType: mediaType } },
    { text: userText },
  ]);

  const text = result.response.text();
  const json = JSON.parse(text);
  const parsed = analysisSchema.safeParse(json);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('Gemini schema mismatch', parsed.error.flatten());
    throw new Error('Gemini response did not match expected schema');
  }
  return parsed.data;
}

/**
 * Chat libre con contexto de una planta. Devuelve texto plano (sin JSON).
 */
export async function chatWithGemini(opts: ChatOpts): Promise<string> {
  const client = getClient();
  if (!client) throw new Error('GEMINI_API_KEY no está configurado');

  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: CHAT_SYSTEM,
    generationConfig: { temperature: 0.7 },
  });

  const contextText = buildPlantContextText(opts.plant);
  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: `Contexto de mi planta:\n${contextText}` }] },
      { role: 'model', parts: [{ text: 'Perfecto, ya tengo el contexto. ¿Qué querés saber?' }] },
      ...opts.history.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    ],
  });

  const result = await chat.sendMessage(opts.question);
  return result.response.text().trim();
}
