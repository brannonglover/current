# Local dev recovery

## Quick start (two terminals)

```bash
# Terminal 1 — API (binds 0.0.0.0:3001 for phone + simulator)
npm run api

# Terminal 2 — Expo
npx expo start -c
```

Physical device: Expo resolves the API from Metro (`exp://YOUR_LAN_IP:8081` → `http://YOUR_LAN_IP:3001`). Override with `EXPO_PUBLIC_API_URL` in `.env` if needed.

## Verify the API

```bash
npm run api:check
curl -s http://127.0.0.1:3001/api/health | head
curl -s "http://127.0.0.1:3001/api/articles?limit=1" | head -c 200
```

Replace `127.0.0.1` with your LAN IP when testing from another device on Wi‑Fi.

## Common failures

### `EADDRINUSE` on port 3001

Another `npm run api` (or zombie Node) is already bound.

```bash
npm run api:stop
npm run api
```

Running `npm run api` again while a **healthy** API is up prints a message and exits — it does not crash with EADDRINUSE.

### `/api/articles` returns 404 while Next says “Ready”

Usually **Watchpack EMFILE** (too many file watchers). The dev script sets `WATCHPACK_POLLING=true` and `CHOKIDAR_USEPOLLING=true`. Fix:

```bash
npm run api:restart
```

If EMFILE persists, raise the file limit in the same shell before starting the API:

```bash
ulimit -n 10240
npm run api
```

### Expo: “Cannot reach the API at http://…”

1. Confirm API: `npm run api:check`
2. Phone and Mac on the same Wi‑Fi; macOS firewall allows Node incoming connections
3. Optional `.env`: `EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:3001`
4. Restart Expo with cache clear: `npx expo start -c`

### Empty feed with API up

Run ingest once:

```bash
npm run api:ingest
```

Pull to refresh in the app (`refresh=true` on the API).

### Expo red screen: `isTopicFilterActive`

Stale Metro bundle. Restart with `npx expo start -c`. Current `PreferencesContext` no longer uses that symbol.
