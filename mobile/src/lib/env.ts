/**
 * Lectura tipada de variables EXPO_PUBLIC_*. Las exportamos como valores
 * normalizados para que el resto del código no se preocupe por undefined.
 */
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const useMocks =
  process.env.EXPO_PUBLIC_USE_MOCKS === 'true' || !supabaseUrl || !supabaseAnonKey;

export const env = {
  apiUrl,
  supabaseUrl,
  supabaseAnonKey,
  useMocks,
};
