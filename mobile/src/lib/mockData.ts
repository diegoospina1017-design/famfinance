import type { AnalysisResult, Plant, PlantDiagnosis, PlantNote, Reminder } from '../types';

export const MOCK_USER = {
  id: 'mock-user',
  email: 'demo@plantcare.ai',
  displayName: 'Demo',
};

export const MOCK_PLANTS: Plant[] = [
  {
    id: 'plant-1',
    userId: MOCK_USER.id,
    nickname: 'Pothos del living',
    commonName: 'Pothos',
    scientificName: 'Epipremnum aureum',
    confidence: 0.94,
    description: 'Trepadora resistente, ideal para luz indirecta.',
    coverPhotoUrl:
      'https://images.unsplash.com/photo-1603436326446-74e2d3b5a3b6?w=800',
    wateringFrequencyDays: 7,
    light: 'luz indirecta brillante',
    temperatureMinC: 15,
    temperatureMaxC: 30,
    humidityPreference: 60,
    substrate: 'universal con perlita',
    fertilizer: 'NPK balanceado mensual',
    lastWateredAt: daysAgo(3),
    nextWateringAt: daysFromNow(4),
    lastHealth: 'green',
    createdAt: daysAgo(20),
  },
  {
    id: 'plant-2',
    userId: MOCK_USER.id,
    nickname: 'Mons del baño',
    commonName: 'Monstera deliciosa',
    scientificName: 'Monstera deliciosa',
    confidence: 0.88,
    description: 'Tropical de hojas perforadas, le gusta humedad alta.',
    coverPhotoUrl:
      'https://images.unsplash.com/photo-1545241047-6083a3684587?w=800',
    wateringFrequencyDays: 9,
    light: 'luz indirecta brillante',
    temperatureMinC: 18,
    temperatureMaxC: 29,
    humidityPreference: 65,
    substrate: 'mezcla aireada con corteza',
    fertilizer: 'NPK 20-20-20 cada 4 semanas',
    lastWateredAt: daysAgo(8),
    nextWateringAt: daysFromNow(1),
    lastHealth: 'yellow',
    createdAt: daysAgo(40),
  },
  {
    id: 'plant-3',
    userId: MOCK_USER.id,
    nickname: 'Albahaca de la cocina',
    commonName: 'Albahaca',
    scientificName: 'Ocimum basilicum',
    confidence: 0.81,
    description: 'Hierba aromática, requiere mucho sol y riego frecuente.',
    coverPhotoUrl:
      'https://images.unsplash.com/photo-1620636419291-9bf45e1d4773?w=800',
    wateringFrequencyDays: 2,
    light: 'sol directo en la mañana',
    temperatureMinC: 18,
    temperatureMaxC: 27,
    humidityPreference: 50,
    substrate: 'hortícola con drenaje',
    fertilizer: 'compost cada 2 semanas',
    lastWateredAt: daysAgo(2),
    nextWateringAt: daysFromNow(0),
    lastHealth: 'red',
    createdAt: daysAgo(10),
  },
];

export const MOCK_REMINDERS: Reminder[] = [
  {
    id: 'rem-1',
    plantId: 'plant-1',
    type: 'watering',
    frequencyDays: 7,
    nextRunAt: daysFromNow(4),
    enabled: true,
  },
  {
    id: 'rem-2',
    plantId: 'plant-2',
    type: 'watering',
    frequencyDays: 9,
    nextRunAt: daysFromNow(1),
    enabled: true,
  },
  {
    id: 'rem-3',
    plantId: 'plant-2',
    type: 'pest-check',
    frequencyDays: 14,
    nextRunAt: daysFromNow(5),
    enabled: true,
  },
  {
    id: 'rem-4',
    plantId: 'plant-3',
    type: 'watering',
    frequencyDays: 2,
    nextRunAt: daysFromNow(0),
    enabled: true,
  },
  {
    id: 'rem-5',
    plantId: 'plant-1',
    type: 'fertilizing',
    frequencyDays: 30,
    nextRunAt: daysFromNow(12),
    enabled: true,
  },
];

export const MOCK_DIAGNOSES: PlantDiagnosis[] = [
  {
    id: 'diag-1',
    plantId: 'plant-2',
    photoUrl: MOCK_PLANTS[1].coverPhotoUrl,
    severity: 'medium',
    health: 'yellow',
    issues: [
      {
        key: 'yellow-leaves',
        label: 'Hojas amarillas',
        detail: 'Posible exceso de riego en hojas inferiores.',
        severity: 'medium',
      },
    ],
    summary:
      'Probablemente regaste de más. Dejá secar el sustrato más entre riegos.',
    lowConfidenceWarning: false,
    lowConfidenceReason: null,
    recommendedActions: [
      { id: 'skip-water-3d', label: 'No riegues por 3 días', dueInDays: 0 },
      { id: 'remove-yellow', label: 'Cortá hojas amarillas', dueInDays: 1 },
    ],
    avoid: ['Riego en exceso', 'Macetas sin drenaje'],
    createdAt: daysAgo(5),
  },
];

export const MOCK_NOTES: PlantNote[] = [
  {
    id: 'note-1',
    plantId: 'plant-2',
    body: 'Cambié al baño porque le gustaba más la humedad.',
    createdAt: daysAgo(15),
  },
];

export function mockAnalysis(): AnalysisResult {
  return {
    identification: {
      commonName: 'Pothos',
      scientificName: 'Epipremnum aureum',
      confidence: 0.92,
      description:
        'Trepadora resistente de hojas acorazonadas, ideal para interiores con luz indirecta.',
    },
    diagnosis: {
      severity: 'low',
      health: 'green',
      issues: [],
      summary:
        'Se ve sana. Mantené la rutina actual y revisá el sustrato cada semana.',
      lowConfidenceWarning: false,
      lowConfidenceReason: null,
    },
    carePlan: {
      wateringFrequencyDays: 7,
      light: 'luz indirecta brillante',
      temperatureMinC: 15,
      temperatureMaxC: 30,
      humidityPreference: 60,
      substrate: 'universal con perlita',
      fertilizer: 'NPK balanceado mensual',
      next7Days: [
        { id: 'water-7d', label: 'Regar cuando los 2cm superiores estén secos', dueInDays: 3 },
        { id: 'rotate-pot', label: 'Rotá la maceta para crecimiento parejo', dueInDays: 5 },
        { id: 'wipe-leaves', label: 'Limpiá las hojas con un paño húmedo', dueInDays: 7 },
      ],
      avoid: ['Sol directo del mediodía', 'Encharcar la maceta'],
    },
  };
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}
