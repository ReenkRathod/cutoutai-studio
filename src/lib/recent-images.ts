export type RecentImage = {
  id: string;
  fileName: string;
  createdAt: string;
  /** Small JPEG preview of the upload; keeps recent list useful after refresh. */
  originalThumb: string | null;
  /** Small transparent PNG preview of the processed output. */
  resultThumb: string | null;
};

const STORAGE_KEY = "cutoutai-recent-images-v1";
const MAX_ITEMS = 24;
const MAX_THUMB_CHARS = 450_000;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("cutoutai-images", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProcessedBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("images", "readwrite");
    const store = tx.objectStore("images");
    const request = store.put(blob, id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadProcessedBlob(id: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("images", "readonly");
    const store = tx.objectStore("images");
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteProcessedBlob(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("images", "readwrite");
    const store = tx.objectStore("images");
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearProcessedBlobs(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("images", "readwrite");
    const store = tx.objectStore("images");
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

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
        typeof o.fileName === "string" &&
        typeof o.createdAt === "string"
      );
    });
  } catch {
    return [];
  }
}

export async function addRecentImage(entry: {
  fileName: string;
  originalThumb: string | null;
  resultThumb: string | null;
  processedBlob: Blob;
}): Promise<RecentImage> {
  const id = crypto.randomUUID();
  const item: RecentImage = {
    id,
    createdAt: new Date().toISOString(),
    fileName: entry.fileName,
    originalThumb:
      entry.originalThumb && entry.originalThumb.length <= MAX_THUMB_CHARS
        ? entry.originalThumb
        : null,
    resultThumb:
      entry.resultThumb && entry.resultThumb.length <= MAX_THUMB_CHARS
        ? entry.resultThumb
        : null,
  };

  try {
    await saveProcessedBlob(id, entry.processedBlob);
  } catch (err) {
    console.error("Failed to save processed image to IndexedDB", err);
  }

  const next = [item, ...loadRecentImages()].slice(0, MAX_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return item;
}

export async function removeRecentImage(id: string): Promise<void> {
  const next = loadRecentImages().filter((x) => x.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  try {
    await deleteProcessedBlob(id);
  } catch (err) {
    console.error("Failed to delete processed blob", err);
  }
}

export async function clearRecentImages(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);
  try {
    await clearProcessedBlobs();
  } catch (err) {
    console.error("Failed to clear processed blobs", err);
  }
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

/** Resize processed blob to a small transparent PNG data URL (best-effort). */
export async function blobToThumbDataUrl(blob: Blob): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(blob);
    const maxEdge = 200;
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
    const dataUrl = canvas.toDataURL("image/png");
    return dataUrl.length <= MAX_THUMB_CHARS ? dataUrl : null;
  } catch {
    return null;
  }
}
