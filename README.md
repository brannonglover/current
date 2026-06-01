# Current

A clean, modern reading app built with Expo. Scroll through curated articles from magazines and news sources, like what resonates, and get personalized recommendations.

## Features

- **Vertical article feed** — scroll up through full-screen story cards
- **Like & share** — save favorites and share via the native share sheet
- **Personalization** — likes build topic preferences that power the "For You" feed
- **Account registration** — sign up to persist your reading taste across sessions
- **RSS ingestion** — real articles from The Atlantic, Ars Technica, MIT Technology Review, Dezeen, and BBC News

## Quick start

You need **two terminals**: the API backend and the Expo app.

### 1. Backend (article ingestion)

```bash
cd backend
npm install
npm run ingest    # fetch RSS feeds into SQLite (first time)
npm run dev       # API at http://localhost:3001 (listens on all interfaces for physical devices)
```

Or from the project root:

```bash
npm run api:ingest
npm run api
```

Troubleshooting (EADDRINUSE, 404 on `/api/articles`, Expo cannot reach API): see [DEV.md](./DEV.md).


### 2. Mobile app

```bash
cp .env.example .env
npm install
npm start
```

- **iOS Simulator:** `EXPO_PUBLIC_API_URL=http://localhost:3001` works as-is.
- **Physical device:** omit `EXPO_PUBLIC_API_URL` in Expo Go (auto-detects your LAN IP from Metro), or set it explicitly, e.g. `http://192.168.1.94:3001` (same Wi‑Fi as your phone). The API must be running (`npm run api`).

If the API is down during development, the app falls back to bundled demo articles so feeds stay usable.

Pull down on a feed tab to refresh articles from the API.

## How ingestion works

SQLite here is a **rolling cache**, not a fixed article list. New stories are fetched from RSS continuously; old ones are pruned after 30 days.

```
RSS feeds ──► ingest worker ──► SQLite cache ──► GET /api/articles ──► app
                    ▲
     cron / app open / pull-to-refresh / every 30 min
```

**When feeds refresh automatically:**

| Trigger | Behavior |
|---------|----------|
| API server starts | Background ingest if cache is empty or stale |
| App opens `/api/articles` | Stale cache refreshes in background (30 min default) |
| Pull-to-refresh | Forces immediate ingest (`?refresh=true`) |
| App foreground / 15 min timer | Re-fetches from API |
| Cron (production) | Every 30 minutes via Vercel |
| `npm run api:watch` | Local poller, same interval |

Each ingest **upserts by URL** — new articles are inserted, existing ones updated. Articles older than 30 days are removed.

### Local continuous ingest

For development, run the API with the watch poller in a third terminal:

```bash
npm run api:watch
```

Or rely on the API's built-in stale check when the app loads articles.

## Project structure

```
app/                 Expo Router screens
backend/             Next.js API + RSS ingestion
  lib/feeds.ts       Source configuration
  lib/ingest.ts      RSS fetch + normalize
  data/current.db    SQLite (local, gitignored)
components/          UI
services/            API client, recommendations
```

## Next steps

- Deploy backend to Vercel and point `EXPO_PUBLIC_API_URL` at production
- Move auth + likes to the API for cross-device sync
- Add more feeds in `backend/lib/feeds.ts`
- Optional: full-text extraction or in-app browser for publisher URLs
