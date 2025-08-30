export type CompressOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0..1 for JPEG/WebP
  mimeType?: string; // e.g., 'image/jpeg'
};

export async function compressImage(
  file: File,
  opts: CompressOptions = {}
): Promise<File> {
  // Skip in tests or non-browser environments
  if (typeof window === 'undefined' || typeof document === 'undefined') return file;
  if (import.meta.env.MODE === 'test') return file;
  if (!file.type.startsWith('image/')) return file;

  const maxWidth = opts.maxWidth ?? 1600;
  const maxHeight = opts.maxHeight ?? 1600;
  const quality = opts.quality ?? 0.8;
  const mimeType = opts.mimeType ?? (file.type || 'image/jpeg');

  try {
    const url = URL.createObjectURL(file);
    const img = await loadImage(url);
    const { width, height } = constrainDimensions(img.naturalWidth || img.width, img.naturalHeight || img.height, maxWidth, maxHeight);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img as unknown as CanvasImageSource, 0, 0, width, height);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, mimeType, quality)
    );
    URL.revokeObjectURL(url);
    if (!blob) return file;

    return new File([blob], file.name, { type: blob.type || mimeType, lastModified: Date.now() });
  } catch {
    return file;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function constrainDimensions(
  w: number,
  h: number,
  maxW: number,
  maxH: number
): { width: number; height: number } {
  const ratio = Math.min(maxW / w, maxH / h, 1);
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}
