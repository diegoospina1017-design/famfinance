/**
 * Calcula la próxima fecha de riego de una planta de forma determinista.
 *
 *   adjustedDays = max(1, baseDays * seasonFactor + humidityBoost)
 *   seasonFactor : 1.2 en invierno, 0.85 en verano, 1 el resto
 *   humidityBoost: (50 - humidityPreference) / 25 → planta húmeda = riega antes
 */
export interface NextWateringInput {
  baseDays: number;
  humidityPreference: number;
  lastWateredAt: Date | string | null;
  /** false (default) = hemisferio sur, true = hemisferio norte */
  northernHemisphere?: boolean;
  now?: Date;
}

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

export function nextWatering(input: NextWateringInput): Date {
  const now = input.now ?? new Date();
  const last = input.lastWateredAt ? new Date(input.lastWateredAt) : now;

  const month = now.getMonth() + 1;
  const winter = input.northernHemisphere ? [12, 1, 2] : [6, 7, 8];
  const summer = input.northernHemisphere ? [6, 7, 8] : [12, 1, 2];
  const seasonFactor = winter.includes(month) ? 1.2 : summer.includes(month) ? 0.85 : 1.0;

  const humidityBoost = clamp((50 - input.humidityPreference) / 25, -1, 1);
  const adjustedDays = Math.max(1, input.baseDays * seasonFactor + humidityBoost);

  const next = new Date(last);
  next.setDate(next.getDate() + Math.round(adjustedDays));
  return next;
}
