import { useRef, useState } from "react";
import { Upload, Sparkles, Zap, ImageIcon } from "lucide-react";
import { BeforeAfter } from "./BeforeAfter";

export function Hero() {
  const [file, setFile] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f?: File) => {
    if (f && f.type.startsWith("image/")) {
      setFile(URL.createObjectURL(f));
    }
  };

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
              handleFile(e.dataTransfer.files[0]);
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
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <img src={file} alt="Preview" className="h-16 w-16 rounded-lg object-cover" />
                <div className="text-sm">
                  <p className="font-semibold">Image ready!</p>
                  <p className="text-muted-foreground">Click to upload another</p>
                </div>
              </div>
            ) : (
              <>
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-gradient-brand shadow-glow">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <p className="mt-3 font-semibold">Drag & drop your image here</p>
                <p className="text-sm text-muted-foreground">or click to browse · PNG, JPG up to 10MB</p>
              </>
            )}
          </div>

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
