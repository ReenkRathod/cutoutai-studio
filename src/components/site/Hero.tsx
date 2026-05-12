import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { Upload, Sparkles, Zap, ImageIcon, History, X, Download } from "lucide-react";
import { BeforeAfter } from "./BeforeAfter";
import {
  addRecentImage,
  clearRecentImages,
  fileToThumbDataUrl,
  loadRecentImages,
  removeRecentImage,
  type RecentImage,
} from "@/lib/recent-images";

const REMOVE_BACKGROUND_WEBHOOK =
  "https://allnighter.app.n8n.cloud/webhook/remove-background";

function parseWebhookImageUrl(json: unknown): string {
  if (!json || typeof json !== "object" || !("url" in json)) {
    throw new Error("Invalid response: expected JSON with a url field.");
  }
  const url = (json as { url: unknown }).url;
  if (typeof url !== "string" || !url.trim()) {
    throw new Error("Invalid response: url must be a non-empty string.");
  }
  return url.trim();
}

/** Avoid mixed-content blocking when the page is served over HTTPS. */
function toHttpsIfNeeded(url: string): string {
  if (url.startsWith("http://")) {
    return `https://${url.slice("http://".length)}`;
  }
  return url;
}

function extensionForImageBlobType(mime: string): string {
  if (mime === "image/jpeg" || mime === "image/jpg") return ".jpg";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/png") return ".png";
  return ".png";
}

async function sendImageBinaryToWebhook(file: File): Promise<string> {
  const res = await fetch(REMOVE_BACKGROUND_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });
  if (!res.ok) {
    throw new Error(`Webhook HTTP ${res.status}`);
  }
  const data: unknown = await res.json();
  return toHttpsIfNeeded(parseWebhookImageUrl(data));
}

export function Hero() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [recentImages, setRecentImages] = useState<RecentImage[]>([]);
  const [sourceFileName, setSourceFileName] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousOriginalUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setRecentImages(loadRecentImages());
  }, []);

  useEffect(() => {
    return () => {
      if (previousOriginalUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(previousOriginalUrlRef.current);
      }
    };
  }, []);

  const handleFile = useCallback(async (f?: File | null) => {
    if (!f || !f.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }

    setError(null);
    setDownloadError(null);
    setProcessedImage(null);
    setProcessing(true);
    setSourceFileName(f.name?.trim() || "image");

    const nextOriginalUrl = URL.createObjectURL(f);
    setOriginalImage(nextOriginalUrl);

    if (previousOriginalUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(previousOriginalUrlRef.current);
    }
    previousOriginalUrlRef.current = nextOriginalUrl;

    try {
      const imageUrl = await sendImageBinaryToWebhook(f);
      setProcessedImage(imageUrl);
      const thumb = await fileToThumbDataUrl(f);
      addRecentImage({ resultUrl: imageUrl, fileName: f.name || "image", originalThumb: thumb });
      setRecentImages(loadRecentImages());
    } catch {
      setProcessedImage(null);
      setError(
        "Background removal failed. Check your connection, CORS settings, or try another image.",
      );
    } finally {
      setProcessing(false);
    }
  }, []);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const imageItem = Array.from(event.clipboardData?.items ?? []).find((item) =>
        item.type.startsWith("image/"),
      );
      if (!imageItem) return;

      const file = imageItem.getAsFile();
      if (file) {
        void handleFile(file);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleFile]);

  const openRecent = useCallback((item: RecentImage) => {
    if (previousOriginalUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(previousOriginalUrlRef.current);
    }
    previousOriginalUrlRef.current = item.originalThumb ?? null;
    setOriginalImage(item.originalThumb);
    setProcessedImage(item.resultUrl);
    setError(null);
    setDownloadError(null);
    setSourceFileName(item.fileName);
  }, []);

  const downloadProcessed = useCallback(async () => {
    if (!processedImage) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const res = await fetch(processedImage);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const ext = extensionForImageBlobType(blob.type || "image/png");
      const rawBase = (sourceFileName ?? "cutout").replace(/\.[^./\\]+$/, "");
      const base = rawBase || "cutout";
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${base}-no-bg${ext}`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setDownloadError(
        "Download failed (often due to browser security). Right-click the result and use “Save image as…”.",
      );
    } finally {
      setDownloading(false);
    }
  }, [processedImage, sourceFileName]);

  const deleteRecent = useCallback((e: MouseEvent, id: string) => {
    e.stopPropagation();
    removeRecentImage(id);
    setRecentImages(loadRecentImages());
  }, []);

  const clearRecent = useCallback(() => {
    clearRecentImages();
    setRecentImages([]);
  }, []);

  const showPreview = Boolean(originalImage || processedImage || processing);

  return (
    <section id="home" className="relative pt-32 pb-20 px-4 overflow-hidden">
      {/* Decorative polygons */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-gradient-brand opacity-20 blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-[var(--neon-cyan)] opacity-20 blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
        <svg className="absolute inset-0 h-full w-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="poly" width="60" height="60" patternUnits="userSpaceOnUse">
              <polygon points="30,5 55,25 45,55 15,55 5,25" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#poly)" />
        </svg>
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium shadow-soft">
            <Sparkles className="h-3.5 w-3.5 text-[var(--neon-purple)]" />
            <span>Powered by next-gen AI</span>
          </div>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Remove Backgrounds in <span className="text-gradient">Seconds</span> with CutoutAI
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            Upload your image and let AI instantly remove backgrounds with pixel-perfect precision.
          </p>

          {/* Upload */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              void handleFile(e.dataTransfer.files[0]);
            }}
            onClick={() => inputRef.current?.click()}
            className={`mt-8 cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${
              drag ? "border-[var(--neon-purple)] bg-[var(--neon-purple)]/5 scale-[1.01]" : "border-border glass"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />
            {showPreview ? (
              <div className="space-y-4">
                <div className={`grid gap-3 ${originalImage ? "sm:grid-cols-2" : "sm:grid-cols-1"}`}>
                  {originalImage ? (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Original
                      </p>
                      <img src={originalImage} alt="Original upload" className="h-36 w-full rounded-lg object-cover" />
                    </div>
                  ) : processedImage ? (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Original
                      </p>
                      <div className="grid h-36 place-items-center rounded-lg border border-dashed border-border bg-muted/30 px-3 text-center text-xs text-muted-foreground">
                        No local preview for this saved result. Upload again to compare side by side.
                      </div>
                    </div>
                  ) : null}
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Background Cleared
                    </p>
                    <div className="checker-bg h-36 overflow-hidden rounded-lg">
                      {processedImage ? (
                        <img
                          src={processedImage}
                          alt="Processed image with background removed"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-xs text-muted-foreground">
                          {processing ? "Processing image..." : "No output yet"}
                        </div>
                      )}
                    </div>
                    {processedImage && !processing && (
                      <div className="mt-2 space-y-1">
                        <button
                          type="button"
                          onClick={() => void downloadProcessed()}
                          disabled={downloading}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background/90 px-3 py-2 text-xs font-semibold shadow-sm transition hover:bg-muted/80 disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
                        >
                          <Download className="h-3.5 w-3.5 shrink-0" />
                          {downloading ? "Preparing download…" : "Download result"}
                        </button>
                        {downloadError && (
                          <p className="text-xs text-red-400">{downloadError}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Click to upload again, drag an image here, or paste with Ctrl+V.
                </p>
              </div>
            ) : (
              <>
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-gradient-brand shadow-glow">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <p className="mt-3 font-semibold">Drag & drop your image here</p>
                <p className="text-sm text-muted-foreground">
                  Click Upload Image, drag here, or paste (Ctrl+V) · PNG, JPG up to 10MB
                </p>
              </>
            )}
            {processing && <p className="mt-3 text-sm font-medium">Removing background...</p>}
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          </div>

          {recentImages.length > 0 && (
            <div className="mt-6 rounded-2xl border border-border glass p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <History className="h-4 w-4 text-[var(--neon-purple)]" />
                  <span>Saved on this device</span>
                </div>
                <button
                  type="button"
                  onClick={clearRecent}
                  className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  Clear all
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {recentImages.map((item) => (
                  <div key={item.id} className="group relative shrink-0">
                    <button
                      type="button"
                      onClick={() => openRecent(item)}
                      className="checker-bg block w-20 overflow-hidden rounded-xl border border-border ring-offset-background transition hover:ring-2 hover:ring-[var(--neon-purple)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-purple)]"
                      title={item.fileName}
                    >
                      <img
                        src={item.resultUrl}
                        alt=""
                        className="aspect-square h-20 w-20 object-contain"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => deleteRecent(e, item.id)}
                      className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full border border-border bg-background text-muted-foreground opacity-0 shadow-sm transition hover:text-foreground group-hover:opacity-100"
                      aria-label="Remove from saved"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Up to 24 results stored in your browser (this computer only). Click a thumbnail to open it.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:scale-105"
            >
              <Upload className="h-4 w-4" /> Upload Image
            </button>
            <a href="#demo" className="inline-flex items-center gap-2 rounded-xl glass px-6 py-3 text-sm font-semibold transition hover:scale-105">
              <ImageIcon className="h-4 w-4" /> See Demo
            </a>
          </div>

          <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-[var(--neon-cyan)]" /> Instant results</div>
            <div className="flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-[var(--neon-purple)]" /> No signup required</div>
          </div>
        </div>

        <div className="relative animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-brand opacity-30 blur-2xl animate-pulse-glow" />
          <BeforeAfter />
        </div>
      </div>
    </section>
  );
}
