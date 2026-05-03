import { getSupabase } from './supabase';
import { env } from './env';

const BUCKET = 'plant-photos';

/**
 * Sube una foto local (URI) a Supabase Storage y devuelve su URL pública.
 * En modo mock, devuelve la URI local.
 */
export async function uploadPlantPhoto(uri: string, userId: string): Promise<string> {
  const sb = getSupabase();
  if (env.useMocks || !sb) {
    return uri;
  }
  const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;
  const res = await fetch(uri);
  const blob = await res.blob();
  const { error } = await sb.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || `image/${ext}`,
    upsert: false,
  });
  if (error) throw error;
  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
