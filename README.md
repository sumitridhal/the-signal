# The Signal

A forkable static RSS newspaper homepage for GitHub Pages.

The Signal turns a list of RSS feeds into a calm front page: lead story, section shelves, source metadata, and browser-only layout controls. It is inspired by a personal reading-room version of Signal, but this repo is intentionally simple: no server, no database, no login, no runtime API routes.

## What You Get

- Static RSS fetching at build time.
- GitHub Pages deployment with scheduled refreshes.
- A newspaper/reading-room homepage built with Vite, React, and TypeScript.
- UI controls for title, deck, theme, density, layout preset, section order, section visibility, and feed enable/disable.
- Browser-local settings via `localStorage`.
- JSON import/export for moving settings between browsers or turning a UI setup into repo config later.

## Quick Start

```bash
npm install
npm run fetch-feeds
npm run dev
```

Open the local URL Vite prints. The app reads generated stories from `public/data/items.json`.

## Configure Feeds

Default feeds live in `src/data/default-feeds.json`.

Each feed has this shape:

```json
{
  "key": "github-blog",
  "name": "GitHub Blog",
  "homepageUrl": "https://github.blog/",
  "feedUrl": "https://github.blog/feed/",
  "section": "technology",
  "tags": ["github", "engineering"],
  "enabled": true
}
```

Supported sections are:

- `technology`
- `ai`
- `business`
- `culture`

`top` is reserved for the front-page rollup and does not need direct feeds.

## UI-Only Customization

The customization panel saves settings in your browser only. This keeps the site GitHub Pages-compatible and avoids GitHub tokens in the browser.

Important tradeoff: feeds added through the UI are included in exported settings, but their stories will not appear in scheduled GitHub Pages refreshes until you add those feeds to `src/data/default-feeds.json` and push the change.

Use **Export JSON** to back up or share a setup. Use **Import settings JSON** to restore it.

## Build

```bash
npm run build
npm run preview
```

`npm run build` runs `npm run fetch-feeds` first, then builds the static app.

For local root previews instead of `/the-signal/`, set:

```bash
VITE_BASE_PATH=/ npm run build
```

## GitHub Pages

This repo includes `.github/workflows/pages.yml`.

To publish:

1. Push the repo to GitHub.
2. Open **Settings -> Pages**.
3. Set the source to **GitHub Actions**.
4. Run the workflow or wait for the next scheduled refresh.

The workflow:

- Installs dependencies with `npm ci`.
- Fetches RSS during `npm run build`.
- Builds with `VITE_BASE_PATH=/the-signal/`.
- Uploads `dist/`.
- Deploys to GitHub Pages.

The site will be available at:

```text
https://sumitridhal.github.io/the-signal/
```

## Scripts

- `npm run dev` starts local development.
- `npm run fetch-feeds` writes `public/data/items.json`.
- `npm run build` fetches feeds and builds static files.
- `npm run preview` serves the production build locally.
- `npm run lint` runs Oxlint.

## Why Static?

GitHub Pages only serves static files. That means The Signal does RSS fetching in GitHub Actions, writes JSON at build time, and lets the browser render a personalized edition from that static data.

This repo intentionally skips SQLite, API routes, accounts, bookmark sync, AI summaries, and full-text extraction. Those are useful later, but they would make the first fork harder.
