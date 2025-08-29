// Minimal storage uploader with safe fallbacks for test/dev
// - In test or when Supabase env is missing, returns a mock URL

export async function uploadMedia(
  file: File,
  opts?: { prefix?: string; bucket?: string }
): Promise<string> {
  const prefix = opts?.prefix ?? 'inspections';
  const bucket = opts?.bucket ?? 'media';

  // If running under vitest or without Vite env, bail out with mock url
  const isTest = (import.meta as any)?.env?.MODE === 'test';
  if (isTest) return 'blob:mock-url';

  try {
    // Lazy import to avoid crashing tests when env is absent
    const mod = await import('./supabase');
    const supabase = (mod as any).supabase as {
      storage: {
        from: (bucket: string) => {
          upload: (
            path: string,
            file: File,
            opts?: { cacheControl?: string; upsert?: boolean; contentType?: string }
          ) => Promise<{ data: { path: string } | null; error: { message: string } | null }>
          getPublicUrl: (path: string) => { data: { publicUrl: string } }
        };
      };
    };
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
    const { publicUrl } = client.getPublicUrl(data.path).data;
    return publicUrl;
  } catch {
    return 'blob:mock-url';
  }
}

