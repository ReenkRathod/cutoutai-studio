import { Scissors } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand shadow-glow">
        <Scissors className="h-5 w-5 text-white" strokeWidth={2.5} />
        <span className="absolute inset-0 rounded-xl bg-gradient-brand opacity-40 blur-md -z-10" />
      </div>
      <span className="text-xl font-bold tracking-tight">
        Cutout<span className="text-gradient">AI</span>
      </span>
    </div>
  );
}
