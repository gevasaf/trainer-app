# AI Trainer README

A personal fitness and diet coaching app powered by Claude AI, with cross-device sync via Supabase and hosted on Vercel.

## Features

- **AI assistant** – chat with your trainer about food, workouts, and progress
- **Food & activity logging** – describe meals or exercise in plain text; Claude parses the nutrition/calorie data
- **Autocomplete & cache** – past entries are suggested as you type; exact matches skip the AI call entirely
- **Body stats timeline** – track weight, waist, and body fat % against your projected goals
- **End-of-day & weekly summaries** – automatic AI recap when you close the day or start a new week
- **Cross-device sync** – data stored per-user in Supabase; works on phone and desktop simultaneously
- **PWA** – installable on iOS and Android as a home screen app
- **Hebrew / English** – full bilingual UI

## Calorie model

The app uses a **lifestyle baseline + log workouts** model:

- **Activity level** (set during onboarding) captures your everyday background movement — commute style, type of job, how much you're on your feet. It does _not_ represent workout frequency.
- **Logged activities** are intentional exercise sessions (gym, runs, cycling, sports) that are genuinely on top of your baseline. These are the burns you track.
- **Net calories** = food eaten − logged workout burns. This is compared against `targetCal` (TDEE − deficit) everywhere: the dashboard ring, end-of-day summaries, weekly averages, and the AI assistant context.

This means on a rest day and a training day the calorie ring measures the same thing — whether you're hitting your intended deficit — and the ring moves in your favour when you log a hard session.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Auth & storage | Supabase (email/password auth, per-user JSONB) |
| AI | Anthropic Claude API (via Vercel serverless functions) |
| Hosting | Vercel |
| CI | GitHub Actions – auto bumps patch version and tags on every push to `main` |

## Local development

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in your keys
cp .env.example .env.local

# 3. Start dev server (proxies API routes via Vercel CLI)
npm run dev
```

### Required environment variables

| Variable | Where to get it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_URL` | same as above (used server-side) |
| `SUPABASE_ANON_KEY` | same as above (used server-side) |
| `ANTHROPIC_API_KEY` | console.anthropic.com |

## Supabase setup

Run [`supabase-schema.sql`](supabase-schema.sql) in the Supabase SQL editor once to create the `user_data` table and enable row-level security.

## Deployment

Pushes to `main` auto-deploy via Vercel (GitHub integration). A GitHub Actions workflow bumps the patch version, commits `vX.Y.Z [skip ci]`, and tags the release — the version is displayed in the app header.
