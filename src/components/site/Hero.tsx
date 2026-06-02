import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import {
  Upload,
  Sparkles,
  Zap,
  ImageIcon,
  History,
  X,
  Download,
  Loader2,
} from "lucide-react";
import { BeforeAfter } from "./BeforeAfter";
import {
  addRecentImage,
  clearRecentImages,
  fileToThumbDataUrl,
  loadRecentImages,
  removeRecentImage,
  blobToThumbDataUrl,
  loadProcessedBlob,
  type RecentImage,
} from "@/lib/recent-images";

export function Hero() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string>("Initialising...");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [recentImages, setRecentImages] = useState<RecentImage[]>([]);
  const [sourceFileName, setSourceFileName] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const prevOriginalUrlRef = useRef<string | null>(null);
  const prevProcessedUrlRef = useRef<string | null>(null);

  // ── helpers ──────────────────────────────────────────────────────────────

  const revokeIfBlob = (url: string | null) => {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
  };

  // ── on mount: load history & cleanup blob URLs on unmount ────────────────

  useEffect(() => {
    setRecentImages(loadRecentImages());
    return () => {
      revokeIfBlob(prevOriginalUrlRef.current);
      revokeIfBlob(prevProcessedUrlRef.current);
    };
  }, []);

  // ── core logic ────────────────────────────────────────────────────────────

  const handleFile = useCallback(async (f?: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Please upload a valid image file (PNG, JPG, WEBP…).");
      return;
    }

    // reset state
    setError(null);
    setDownloadError(null);
    setProcessedImage(null);
    setProgressPercent(0);
    setProgressMessage("Loading AI engine…");
    setProcessing(true);
    setSourceFileName(f.name?.trim() || "image");

    // show original preview immediately
    const nextOriginalUrl = URL.createObjectURL(f);
    revokeIfBlob(prevOriginalUrlRef.current);
    prevOriginalUrlRef.current = nextOriginalUrl;
    setOriginalImage(nextOriginalUrl);

    revokeIfBlob(prevProcessedUrlRef.current);
    prevProcessedUrlRef.current = null;

    try {
      setProgressMessage("Uploading image…");
      setProgressPercent(20);

      const formData = new FormData();
      formData.append("image", f);

      const response = await fetch("/api/remove-bg", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Server failed to remove background");
      }

      setProgressMessage("Processing image…");
      setProgressPercent(60);

      const resultBlob = await response.blob();
      setProgressPercent(100);
      setProgressMessage("Done!");

      const imageUrl = URL.createObjectURL(resultBlob);
      prevProcessedUrlRef.current = imageUrl;
      setProcessedImage(imageUrl);

      // save to history (non-blocking)
      Promise.all([fileToThumbDataUrl(f), blobToThumbDataUrl(resultBlob)])
        .then(([thumb, resultThumb]) =>
          addRecentImage({
            fileName: f.name || "image",
            originalThumb: thumb,
            resultThumb,
            processedBlob: resultBlob,
          }),
        )
        .then(() => setRecentImages(loadRecentImages()))
        .catch(console.warn);
    } catch (err: any) {
      console.error("[bg-removal]", err);
      setProcessedImage(null);
      setError(err.message || "Background removal failed. Please try a different image.");
    } finally {
      setProcessing(false);
    }
  }, []);

  // paste support
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/"),
      );
      const file = item?.getAsFile();
      if (file) void handleFile(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleFile]);

  // open saved result
  const openRecent = useCallback(async (item: RecentImage) => {
    setError(null);
    setDownloadError(null);
    setSourceFileName(item.fileName);

    revokeIfBlob(prevOriginalUrlRef.current);
    prevOriginalUrlRef.current = item.originalThumb ?? null;
    setOriginalImage(item.originalThumb);

    revokeIfBlob(prevProcessedUrlRef.current);
    prevProcessedUrlRef.current = null;
    setProcessedImage(null);

    setProgressMessage("Loading saved image…");
    setProgressPercent(100);
    setProcessing(true);

    try {
      const blob = await loadProcessedBlob(item.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        prevProcessedUrlRef.current = url;
        setProcessedImage(url);
      } else {
        setProcessedImage(item.resultThumb ?? null);
      }
    } catch {
      setProcessedImage(item.resultThumb ?? null);
    } finally {
      setProcessing(false);
    }
  }, []);

  // download
  const downloadProcessed = useCallback(() => {
    if (!processedImage) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const rawBase = (sourceFileName ?? "cutout").replace(/\.[^./\\]+$/, "");
      const base = rawBase || "cutout";
      const a = document.createElement("a");
      a.href = processedImage;
      a.download = `${base}-no-bg.png`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      setDownloadError(
        "Download failed. Right-click the result and choose 'Save image as…'.",
      );
    } finally {
      setDownloading(false);
    }
  }, [processedImage, sourceFileName]);

  const deleteRecent = useCallback(async (e: MouseEvent, id: string) => {
    e.stopPropagation();
    await removeRecentImage(id);
    setRecentImages(loadRecentImages());
  }, []);

  const clearRecent = useCallback(async () => {
    await clearRecentImages();
    setRecentImages([]);
  }, []);

  const showPreview = Boolean(originalImage || processedImage || processing);

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <section id="home" className="relative pt-32 pb-20 px-4 overflow-hidden">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-gradient-brand opacity-20 blur-3xl animate-pulse-glow" />
        <div
          className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-[var(--neon-cyan)] opacity-20 blur-3xl animate-pulse-glow"
          style={{ animationDelay: "1.5s" }}
        />
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.07]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="poly"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <polygon
                points="30,5 55,25 45,55 15,55 5,25"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#poly)" />
        </svg>
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        {/* ── left column ── */}
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium shadow-soft">
            <Sparkles className="h-3.5 w-3.5 text-[var(--neon-purple)]" />
            <span>Powered by next-gen AI — runs in your browser</span>
          </div>

          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Remove Backgrounds in{" "}
            <span className="text-gradient">Seconds</span> with Cutout AI
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            Upload your image and let AI instantly remove backgrounds with
            pixel-perfect precision — 100% private, no uploads to any server.
          </p>

          {/* ── Drop zone ── */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!processing) setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              if (!processing) void handleFile(e.dataTransfer.files[0]);
            }}
            onClick={() => {
              if (!processing) inputRef.current?.click();
            }}
            className={`mt-8 rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
              processing
                ? "cursor-default border-[var(--neon-purple)]/50 glass"
                : drag
                  ? "cursor-copy border-[var(--neon-purple)] bg-[var(--neon-purple)]/5 scale-[1.01]"
                  : "cursor-pointer border-border glass hover:border-[var(--neon-purple)]/40"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => void handleFile(e.target.files?.[0])}
              // reset value so same file can be re-selected
              onClick={(e) => ((e.target as HTMLInputElement).value = "")}
            />

            {showPreview ? (
              <div className="space-y-4">
                {/* before / after thumbnails */}
                <div
                  className={`grid gap-3 ${originalImage ? "sm:grid-cols-2" : "sm:grid-cols-1"}`}
                >
                  {originalImage && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Original
                      </p>
                      <img
                        src={originalImage}
                        alt="Original upload"
                        className="h-36 w-full rounded-lg object-cover"
                      />
                    </div>
                  )}

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Background Cleared
                    </p>
                    <div className="checker-bg relative h-36 overflow-hidden rounded-lg">
                      {processedImage && !processing ? (
                        <img
                          src={processedImage}
                          alt="Processed — background removed"
                          className="h-full w-full object-contain"
                        />
                      ) : processing ? (
                        /* ── Animated loading state ── */
                        <div className="flex h-full flex-col items-center justify-center gap-3">
                          <div className="relative flex h-12 w-12 items-center justify-center">
                            <Loader2 className="h-10 w-10 animate-spin text-[var(--neon-purple)]" />
                            <span className="absolute text-[10px] font-bold text-[var(--neon-purple)]">
                              {progressPercent}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="grid h-full place-items-center text-xs text-muted-foreground">
                          No output yet
                        </div>
                      )}
                    </div>

                    {/* Download button — stopPropagation so it doesn't open file picker */}
                    {processedImage && !processing && (
                      <div
                        className="mt-2 space-y-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={downloadProcessed}
                          disabled={downloading}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background/90 px-3 py-2 text-xs font-semibold shadow-sm transition hover:bg-muted/80 disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
                        >
                          <Download className="h-3.5 w-3.5 shrink-0" />
                          {downloading ? "Preparing…" : "Download result"}
                        </button>
                        {downloadError && (
                          <p className="text-xs text-red-400">{downloadError}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar — only while processing */}
                {processing && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-[var(--neon-purple)]">
                      {progressMessage}
                    </p>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-gradient-brand transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {!processing && (
                  <p className="text-sm text-muted-foreground">
                    Click to upload again, drag an image here, or paste with
                    Ctrl+V.
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-gradient-brand shadow-glow">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <p className="mt-3 font-semibold">Drag & drop your image here</p>
                <p className="text-sm text-muted-foreground">
                  Click Upload Image, drag here, or paste (Ctrl+V) · PNG, JPG,
                  WEBP
                </p>
              </>
            )}

            {error && (
              <p className="mt-3 text-sm text-red-400" onClick={(e) => e.stopPropagation()}>
                {error}
              </p>
            )}
          </div>

          {/* ── Recent images ── */}
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
                      onClick={() => void openRecent(item)}
                      className="checker-bg block w-20 overflow-hidden rounded-xl border border-border ring-offset-background transition hover:ring-2 hover:ring-[var(--neon-purple)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon-purple)]"
                      title={item.fileName}
                    >
                      {item.resultThumb ? (
                        <img
                          src={item.resultThumb}
                          alt=""
                          className="aspect-square h-20 w-20 object-contain"
                        />
                      ) : (
                        <div className="flex aspect-square h-20 w-20 items-center justify-center text-[8px] text-muted-foreground">
                          {item.fileName.slice(0, 12)}
                        </div>
                      )}
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
                Up to 24 results stored in your browser. Click a thumbnail to
                reopen.
              </p>
            </div>
          )}

          {/* ── CTA buttons ── */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => !processing && inputRef.current?.click()}
              disabled={processing}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Upload className="h-4 w-4" /> Upload Image
            </button>
            <a
              href="#demo"
              className="inline-flex items-center gap-2 rounded-xl glass px-6 py-3 text-sm font-semibold transition hover:scale-105"
            >
              <ImageIcon className="h-4 w-4" /> See Demo
            </a>
          </div>

          <div className="mt-8 flex items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-[var(--neon-cyan)]" /> Instant
              results
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[var(--neon-purple)]" /> No
              signup required
            </div>
          </div>
        </div>

        {/* ── right column ── */}
        <div
          className="relative animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-brand opacity-30 blur-2xl animate-pulse-glow" />
          <BeforeAfter />
        </div>
      </div>
    </section>
  );
}
