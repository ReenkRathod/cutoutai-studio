# CutoutAI Studio

CutoutAI is a web app for AI-powered background removal. Upload or paste an image, get a transparent cutout in seconds, and download the result. The landing page includes pricing with Razorpay checkout for the Pro plan.

## Features

- **Instant removal** — drag-and-drop, file picker, or paste from clipboard
- **Before/after preview** — compare original and processed images side by side
- **Recent images** — last 24 results stored in the browser (`localStorage`)
- **Pro checkout** — Razorpay orders, payment verification, and signed webhooks
- **Responsive UI** — React 19, Tailwind CSS 4, Radix UI components

## Tech stack

| Layer | Tools |
| --- | --- |
| Framework | [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) |
| UI | React 19, Tailwind CSS 4, shadcn-style Radix components |
| Payments | Razorpay (Checkout + REST API) |
| Deploy | Cloudflare Workers (default) or Vercel (Nitro) |

Background removal is handled by an external n8n webhook; the app POSTs the raw image bytes and expects JSON `{ "url": "<processed-image-url>" }`.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ (22 recommended)
- npm (or pnpm / yarn)
- [Razorpay](https://razorpay.com/) test keys (for Pro checkout)
- A background-removal webhook that accepts `POST` with the image body and returns `{ "url": "..." }`

## Getting started

```bash
cd cutoutai-studio
npm install
```

### Environment variables

Copy the example files and add your secrets (never commit real keys):

```bash
cp .env.example .env
cp .dev.vars.example .dev.vars
```

| Variable | Where | Purpose |
| --- | --- | --- |
| `RAZORPAY_KEY_ID` | `.env` / `.dev.vars` / host secrets | Razorpay API key (public in checkout) |
| `RAZORPAY_KEY_SECRET` | server only | Create orders on the server |
| `RAZORPAY_WEBHOOK_SECRET` | server only | Verify `POST /api/razorpay/webhook` |
| `PRO_PLAN_AMOUNT_INR` | optional | Pro price in INR (default `1599`) |

- **`.env`** — used by Vite during local dev when applicable
- **`.dev.vars`** — used by Wrangler for Cloudflare Workers local dev (gitignored)

Use Razorpay **Test mode** keys until you go live.

### Run locally

```bash
npm run dev
```

Open the URL printed in the terminal (often `http://localhost:5173`).

For Cloudflare Workers-style local runs with `.dev.vars`, use Wrangler via the Cloudflare Vite plugin (included in the default dev setup).

### Build & preview

```bash
npm run build
npm run preview
```

## Background removal webhook

The client sends images to the webhook defined in `src/components/site/Hero.tsx`:

```ts
const REMOVE_BACKGROUND_WEBHOOK =
  "https://allnighter.app.n8n.cloud/webhook/remove-background";
```

To use your own pipeline, change that URL (or refactor it to an env-driven value). The endpoint must:

1. Accept `POST` with `Content-Type` matching the uploaded file
2. Return `200` with JSON: `{ "url": "https://..." }`
3. Allow browser `fetch` from your app origin (CORS), or proxy the call through a server route

## Razorpay integration

Server routes (TanStack Start API handlers):

| Route | Method | Description |
| --- | --- | --- |
| `/api/razorpay/create-order` | POST | Creates a Razorpay order (`amountInRupees`, optional `receipt` / `notes`) |
| `/api/razorpay/verify-payment` | POST | Verifies signature after checkout |
| `/api/razorpay/webhook` | POST | Handles Razorpay webhooks (HMAC on raw body) |

**Webhook URL (production):** `https://YOUR_DOMAIN/api/razorpay/webhook`

Configure the same secret in the Razorpay Dashboard → Webhooks and in `RAZORPAY_WEBHOOK_SECRET`.

## Deployment

### Cloudflare Workers (default)

The repo includes `wrangler.jsonc` with entry `src/server.ts`. Build with the default Vite config (Cloudflare plugin enabled when `VERCEL` is not set), then deploy with Wrangler:

```bash
npm run build
npx wrangler deploy
```

Set secrets in the Cloudflare dashboard or with `wrangler secret put RAZORPAY_KEY_SECRET` (and the other variables).

### Vercel

When `VERCEL=1` at build time, Vite disables the Cloudflare plugin and uses Nitro instead (`vite.config.ts`). Connect the repo to Vercel and add the Razorpay environment variables in project settings.

## Project structure

```
cutoutai-studio/
├── src/
│   ├── components/site/   # Landing page sections (Hero, Pricing, …)
│   ├── routes/            # File-based routes + API handlers
│   ├── lib/               # Razorpay crypto, recent images, error handling
│   └── server.ts          # Cloudflare Worker fetch wrapper
├── wrangler.jsonc         # Cloudflare Workers config
├── vite.config.ts         # Vite + TanStack Start + deploy targets
├── .env.example
└── .dev.vars.example
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run build:dev` | Development-mode build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## License

Private project — all rights reserved unless otherwise specified.
