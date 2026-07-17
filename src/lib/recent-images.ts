import { supabase } from "@/lib/supabase";

export type RecentImage = {
  id: string;
  fileName: string;
  createdAt: string;
  /** Small JPEG preview of the upload; keeps recent list useful after refresh. */
  originalThumb: string | null;
  /** Small transparent PNG preview of the processed output. */
  resultThumb: string | null;
  /** Storage path if saved in cloud */
  storagePath?: string;
  /** Time taken to process in milliseconds */
  processingTimeMs?: number;
};

const MAX_ITEMS = 24;
const MAX_THUMB_CHARS = 450_000;

// -- MAIN HISTORY LOGIC --

// -- MAIN HISTORY LOGIC --

export async function loadRecentImages(): Promise<RecentImage[]> {
  if (typeof window === "undefined") return [];

  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;

  if (user) {
    // Cloud fetch
    const { data, error } = await supabase
      .from("user_images")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(MAX_ITEMS);

    if (error) {
      console.error("Failed to load cloud history:", error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      fileName: row.file_name,
      createdAt: row.created_at,
      originalThumb: row.original_thumb,
      resultThumb: row.result_thumb,
      storagePath: row.storage_path,
    }));
  }
  
  return [];
}

export async function addRecentImage(entry: {
  fileName: string;
  originalThumb: string | null;
  resultThumb: string | null;
  processedBlob: Blob;
  processingTimeMs?: number;
}): Promise<RecentImage> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;

  const originalThumb = entry.originalThumb && entry.originalThumb.length <= MAX_THUMB_CHARS ? entry.originalThumb : null;
  const resultThumb = entry.resultThumb && entry.resultThumb.length <= MAX_THUMB_CHARS ? entry.resultThumb : null;

  if (user) {
    const id = crypto.randomUUID();
    const storagePath = `${user.id}/${id}.png`;

    // 1. Upload Blob
    const { error: uploadError } = await supabase.storage
      .from("processed_images")
      .upload(storagePath, entry.processedBlob, { contentType: "image/png" });

    if (uploadError) {
      console.error("Failed to upload image to storage", uploadError);
    }

    // 2. Insert metadata
    const { data, error: insertError } = await supabase
      .from("user_images")
      .insert({
        id,
        user_id: user.id,
        file_name: entry.fileName,
        original_thumb: originalThumb,
        result_thumb: resultThumb,
        storage_path: storagePath,
        processing_time_ms: entry.processingTimeMs || 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to save cloud metadata", insertError);
    }

    return {
      id,
      fileName: entry.fileName,
      createdAt: data?.created_at || new Date().toISOString(),
      originalThumb,
      resultThumb,
      storagePath,
      processingTimeMs: entry.processingTimeMs,
    };
  }

  throw new Error("Must be logged in to save history.");
}

export async function removeRecentImage(item: RecentImage): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;

  if (user) {
    await supabase.from("user_images").delete().eq("id", item.id);
    if (item.storagePath) {
      await supabase.storage.from("processed_images").remove([item.storagePath]);
    }
  }
}

export async function clearRecentImages(): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;

  if (user) {
    const { data: items } = await supabase.from("user_images").select("id, storage_path");
    if (items && items.length > 0) {
      const paths = items.map((i) => i.storage_path).filter(Boolean);
      if (paths.length > 0) {
        await supabase.storage.from("processed_images").remove(paths);
      }
      await supabase.from("user_images").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // Deletes all for user due to RLS
    }
  }
}

export async function loadProcessedBlob(item: RecentImage): Promise<Blob | null> {
  if (item.storagePath) {
    const { data, error } = await supabase.storage
      .from("processed_images")
      .download(item.storagePath);
    
    if (error) {
      console.error("Failed to download cloud blob", error);
      return null;
    }
    return data;
  }
  return null;
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
