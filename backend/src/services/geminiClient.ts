import { GoogleGenerativeAI } from '@google/generative-ai';
import { plantAnalysisPrompt } from '../prompts/plantAnalysis.js';
import {
  analysisSchema,
  resolveImage,
  type Analysis,
  type AnalyzeOpts,
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

  const modelName = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
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
