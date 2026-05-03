import type { Analysis } from '../services/aiClient.js';

/**
 * Respuesta simulada para usar sin API key. Varía un poco según el hash de la
 * URL de la imagen para que parezca dinámica.
 */
export function mockAnalysis(imageUrl?: string): Analysis {
  const hash = [...(imageUrl ?? 'default')].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const variant = hash % 3;

  const variants: Analysis[] = [
    {
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
        summary: 'Se ve sana. Mantené la rutina actual y revisá el sustrato cada semana.',
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
        fertilizer: 'NPK balanceado, mensual diluido al 50%',
        next7Days: [
          { id: 'water-7d', label: 'Regar cuando los 2cm superiores estén secos', dueInDays: 3 },
          { id: 'rotate-pot', label: 'Rotá la maceta para crecimiento parejo', dueInDays: 5 },
          { id: 'wipe-leaves', label: 'Limpiá las hojas con un paño húmedo', dueInDays: 7 },
        ],
        avoid: ['Sol directo del mediodía', 'Encharcar la maceta', 'Corrientes de aire frío'],
      },
    },
    {
      identification: {
        commonName: 'Monstera deliciosa',
        scientificName: 'Monstera deliciosa',
        confidence: 0.88,
        description:
          'Planta tropical de hojas grandes con perforaciones características.',
      },
      diagnosis: {
        severity: 'medium',
        health: 'yellow',
        issues: [
          {
            key: 'yellow-leaves',
            label: 'Hojas amarillas',
            detail:
              'Se observan hojas inferiores amarillentas, posiblemente por exceso de riego.',
            severity: 'medium',
          },
        ],
        summary:
          'Probablemente regaste de más. Dejá que el sustrato se seque más entre riegos.',
        lowConfidenceWarning: false,
        lowConfidenceReason: null,
      },
      carePlan: {
        wateringFrequencyDays: 9,
        light: 'luz indirecta brillante',
        temperatureMinC: 18,
        temperatureMaxC: 29,
        humidityPreference: 65,
        substrate: 'mezcla aireada con corteza y perlita',
        fertilizer: 'NPK 20-20-20 cada 4 semanas en primavera-verano',
        next7Days: [
          { id: 'skip-water-3d', label: 'No riegues durante 3 días para airear las raíces', dueInDays: 0 },
          { id: 'remove-yellow', label: 'Cortá las hojas amarillas en la base', dueInDays: 1 },
          { id: 'check-drainage', label: 'Verificá que la maceta drene bien', dueInDays: 2 },
        ],
        avoid: ['Riego en exceso', 'Sustrato compactado', 'Macetas sin agujeros'],
      },
    },
    {
      identification: {
        commonName: 'Albahaca',
        scientificName: 'Ocimum basilicum',
        confidence: 0.81,
        description: 'Hierba aromática anual, requiere mucho sol y riego frecuente.',
      },
      diagnosis: {
        severity: 'high',
        health: 'red',
        issues: [
          {
            key: 'underwatering',
            label: 'Falta de agua',
            detail: 'Hojas caídas y bordes secos. Necesita riego inmediato.',
            severity: 'high',
          },
          {
            key: 'sunburn',
            label: 'Posible quemadura por sol',
            detail: 'Se ven manchas marrones en hojas expuestas.',
            severity: 'medium',
          },
        ],
        summary: 'La planta está estresada por sed y sol fuerte. Regá ya y movela a sombra parcial.',
        lowConfidenceWarning: false,
        lowConfidenceReason: null,
      },
      carePlan: {
        wateringFrequencyDays: 2,
        light: 'sol directo en la mañana, sombra al mediodía',
        temperatureMinC: 18,
        temperatureMaxC: 27,
        humidityPreference: 50,
        substrate: 'sustrato para hortalizas con buen drenaje',
        fertilizer: 'compost o emulsión de algas cada 2 semanas',
        next7Days: [
          { id: 'water-now', label: 'Regá ya y empapá el sustrato', dueInDays: 0 },
          { id: 'move-shade', label: 'Movela a un lugar con sombra al mediodía', dueInDays: 0 },
          { id: 'pinch-tops', label: 'Pellizcá las puntas para fomentar nuevas hojas', dueInDays: 4 },
        ],
        avoid: ['Sol directo del mediodía en verano', 'Suelo seco más de un día'],
      },
    },
  ];

  return variants[variant];
}
