import { formatDistanceToNow, format } from 'date-fns';

export function relativeFromNow(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return formatDistanceToNow(d, { addSuffix: true });
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return format(new Date(iso), 'dd MMM');
}

export function isOverdue(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() <= Date.now();
}

export function severityLabel(s: 'low' | 'medium' | 'high'): string {
  return { low: 'Baja', medium: 'Media', high: 'Alta' }[s];
}

export function reminderLabel(t: 'watering' | 'fertilizing' | 'pest-check'): string {
  return { watering: 'Riego', fertilizing: 'Fertilización', 'pest-check': 'Revisar plagas' }[t];
}

export function reminderEmoji(t: 'watering' | 'fertilizing' | 'pest-check'): string {
  return { watering: '💧', fertilizing: '🌱', 'pest-check': '🔍' }[t];
}
