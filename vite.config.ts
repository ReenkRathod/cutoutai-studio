// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

/** Vercel sets VERCEL=1 during build; TanStack Start on Vercel needs Nitro, not Cloudflare Workers. */
const deployVercel = process.env.VERCEL === "1";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// Cloudflare: @cloudflare/vite-plugin uses this. Vercel: Nitro + disable Cloudflare plugin.
export default defineConfig({
  cloudflare: deployVercel ? false : undefined,
  plugins: deployVercel ? [nitro()] : [],
  tanstackStart: {
    server: { entry: "server" },
  },
});
