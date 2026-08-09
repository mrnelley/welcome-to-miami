# Welcome to Miami

A Vice City–inspired landing page for the HDC Employee Dinner survey.

## Stack

- Vite + React + TypeScript
- SurveyMonkey popup survey (launched via button)
- Deployed to [Vercel](https://vercel.com)

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Survey button

The SurveyMonkey script loads **on button click** so the popup does not auto-open when visitors land on the page.

If the survey does not appear when clicking **Launch Survey**, check your SurveyMonkey collector settings:

1. Open your survey → **Publish** → **Website collector**
2. Under **Behavior**, set the popup to show **Immediately** (the script triggers on load)
3. Alternatively, switch the collector type to **Embedded button** if you want SurveyMonkey to manage the trigger directly

## Deploy to Vercel

### Option A — Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts. Use these settings when asked:

| Setting | Value |
|---------|-------|
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |

### Option B — GitHub + Vercel dashboard

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the repository
4. Vercel auto-detects Vite — click **Deploy**

No environment variables are required.

## Project structure

```
src/
  components/   # Hero, survey card, background, audio toggle
  lib/          # SurveyMonkey loader
```
