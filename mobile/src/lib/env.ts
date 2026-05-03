/**
 * Lectura tipada de variables EXPO_PUBLIC_*. Las exportamos como valores
 * normalizados para que el resto del código no se preocupe por undefined.
 */
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const explicitMocks = process.env.EXPO_PUBLIC_USE_MOCKS === 'true';
const supabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;
const apiConfigured = !!apiUrl && apiUrl !== 'http://localhost:4000';

export const env = {
  apiUrl,
  supabaseUrl,
  supabaseAnonKey,
  // Auth, Plants table, Storage: usamos mock si no hay Supabase configurado
  // o si el usuario lo pidió explícitamente.
  useMocks: explicitMocks || !supabaseConfigured,
  // Llamadas a la IA (backend): mock sólo si lo pide explícitamente
  // o si NO hay un EXPO_PUBLIC_API_URL real configurado.
  useMockAi: explicitMocks || !apiConfigured,
};
