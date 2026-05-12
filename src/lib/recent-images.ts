export type RecentImage = {
  id: string;
  resultUrl: string;
  fileName: string;
  createdAt: string;
  /** Small JPEG preview of the upload; keeps recent list useful after refresh. */
  originalThumb: string | null;
};

const STORAGE_KEY = "cutoutai-recent-images-v1";
const MAX_ITEMS = 24;
const MAX_THUMB_CHARS = 450_000;

export function loadRecentImages(): RecentImage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is RecentImage => {
      if (!x || typeof x !== "object") return false;
      const o = x as Record<string, unknown>;
      return (
        typeof o.id === "string" &&
        typeof o.resultUrl === "string" &&
        typeof o.fileName === "string" &&
        typeof o.createdAt === "string"
      );
    });
  } catch {
    return [];
  }
}

export function addRecentImage(entry: {
  resultUrl: string;
  fileName: string;
  originalThumb: string | null;
}): RecentImage {
  const item: RecentImage = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    resultUrl: entry.resultUrl,
    fileName: entry.fileName,
    originalThumb:
      entry.originalThumb && entry.originalThumb.length <= MAX_THUMB_CHARS
        ? entry.originalThumb
        : null,
  };
  const next = [item, ...loadRecentImages().filter((x) => x.resultUrl !== entry.resultUrl)].slice(
    0,
    MAX_ITEMS,
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return item;
}

export function removeRecentImage(id: string): void {
  const next = loadRecentImages().filter((x) => x.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearRecentImages(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Resize to a small JPEG data URL for localStorage (best-effort). */
export async function fileToThumbDataUrl(file: File): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const maxEdge = 280;
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return null;
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
    return dataUrl.length <= MAX_THUMB_CHARS ? dataUrl : null;
  } catch {
    return null;
  }
}
