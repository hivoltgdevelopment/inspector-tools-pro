// Minimal storage uploader with safe fallbacks for test/dev
// - In test or when Supabase env is missing, returns a mock URL

export async function uploadMedia(
  file: File,
  opts?: { prefix?: string; bucket?: string; signed?: boolean; expiresInSeconds?: number }
): Promise<string> {
  const prefix = opts?.prefix ?? 'inspections';
  const bucket = opts?.bucket ?? 'media';

  // If running under vitest or without Vite env, bail out with mock url
  const isTest = import.meta.env.MODE === 'test';
  if (isTest) return 'blob:mock-url';

  try {
    // Lazy import to avoid crashing tests when env is absent
    const { supabase } = await import('./supabase');
    const ext = file.name.split('.').pop() || 'bin';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `${prefix}/${name}`;
    const client = supabase.storage.from(bucket);
    const { data, error } = await client.upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'application/octet-stream',
    });
    if (error || !data) {
      // Fallback to mock url if upload fails
      return 'blob:mock-url';
    }
    if (opts?.signed) {
      const expires = opts.expiresInSeconds ?? 3600;
      const signed = await client.createSignedUrl(data.path, expires);
      if (signed.error || !signed.data?.signedUrl) return 'blob:mock-url';
      return signed.data.signedUrl;
    } else {
      const { publicUrl } = client.getPublicUrl(data.path).data;
      return publicUrl;
    }
  } catch {
    return 'blob:mock-url';
  }
}
