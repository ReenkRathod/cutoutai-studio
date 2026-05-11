import { useRef, useState, useCallback } from "react";
import beforeImg from "@/assets/demo-before.jpg";
import afterImg from "@/assets/demo-after.png";

export function BeforeAfter() {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onMove = useCallback((clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const p = ((clientX - r.left) / r.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  }, []);

  return (
    <div
      ref={ref}
      className="relative aspect-square w-full select-none overflow-hidden rounded-3xl shadow-glow ring-1 ring-white/40"
      onMouseMove={(e) => dragging.current && onMove(e.clientX)}
      onMouseUp={() => (dragging.current = false)}
      onMouseLeave={() => (dragging.current = false)}
      onTouchMove={(e) => onMove(e.touches[0].clientX)}
    >
      {/* After (transparent on checker) */}
      <div className="absolute inset-0 checker-bg">
        <img
          src={afterImg}
          alt="After background removal"
          className="h-full w-full object-cover"
          width={1024}
          height={1024}
        />
      </div>
      {/* Before clipped */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <img
          src={beforeImg}
          alt="Before background removal"
          className="h-full w-full object-cover"
          width={1024}
          height={1024}
        />
      </div>
      {/* Slider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-glow"
        style={{ left: `${pos}%` }}
      >
        <button
          onMouseDown={() => (dragging.current = true)}
          onTouchStart={() => (dragging.current = true)}
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-gradient-brand shadow-glow ring-4 ring-white/70 cursor-ew-resize"
          aria-label="Drag to compare"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
            <polyline points="9 18 15 12 9 6" transform="translate(6 0)" />
          </svg>
        </button>
      </div>
      <span className="absolute top-3 left-3 rounded-full glass px-3 py-1 text-xs font-semibold">Before</span>
      <span className="absolute top-3 right-3 rounded-full glass px-3 py-1 text-xs font-semibold">After</span>
    </div>
  );
}
