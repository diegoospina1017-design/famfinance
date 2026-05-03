import { apiFetch } from './client';
import { env } from '../lib/env';
import { mockAnalysis } from '../lib/mockData';
import { nextWatering } from '../utils/nextWatering';
import type { AnalysisResult, IdentifyResponse } from '../types';

export async function identifyPlant(imageUrl: string): Promise<IdentifyResponse> {
  if (env.useMocks) {
    await delay(700);
    const analysis = mockAnalysis();
    return {
      analysis,
      suggestedNextWateringAt: nextWatering({
        baseDays: analysis.carePlan.wateringFrequencyDays,
        humidityPreference: analysis.carePlan.humidityPreference,
        lastWateredAt: new Date(),
      }).toISOString(),
    };
  }
  return apiFetch<IdentifyResponse>('/identify', {
    method: 'POST',
    body: JSON.stringify({ imageUrl }),
  });
}

export async function diagnosePlant(
  plantId: string,
  imageUrl: string,
): Promise<{ analysis: AnalysisResult }> {
  if (env.useMocks) {
    await delay(700);
    return { analysis: mockAnalysis() };
  }
  return apiFetch('/diagnose', {
    method: 'POST',
    body: JSON.stringify({ plantId, imageUrl }),
  });
}

export async function sendFeedback(input: {
  plantId: string;
  recommendationId: string;
  helpful: boolean;
  comment?: string;
}): Promise<void> {
  if (env.useMocks) {
    await delay(200);
    return;
  }
  await apiFetch('/feedback', { method: 'POST', body: JSON.stringify(input) });
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
