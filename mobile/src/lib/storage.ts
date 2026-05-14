import { getSupabase } from './supabase';
import { env } from './env';

const BUCKET = 'plant-photos';

/**
 * Sube una foto local (URI) a Supabase Storage y devuelve su URL pública.
 * En modo mock o sin Supabase, devuelve la URI local (sólo sirve para mostrar
 * en la UI; para mandar al backend usá `readImageAsBase64`).
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

/**
 * Lee una foto local y la devuelve en base64 (sin el prefijo data:).
 * Lo usa CaptureScreen cuando no hay Supabase Storage para mandar la imagen
 * al backend dentro del POST.
 */
export async function readImageAsBase64(
  uri: string,
): Promise<{ base64: string; mediaType: string }> {
  const res = await fetch(uri);
  const blob = await res.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  // formato: "data:image/jpeg;base64,XXXXXX"
  const [meta, base64] = dataUrl.split(',');
  const match = meta.match(/data:(.*);base64/);
  const mediaType = match?.[1] ?? blob.type ?? 'image/jpeg';
  return { base64, mediaType };
}
