# Kratos

A dead-simple gym habit tracker. Open the app, tap one big button to mark today's workout done. Everything else — streaks, streak-freezes, milestones — wraps around that single action.

No workout logging, no sets/reps, no exercise library, no accounts. No login either — see **Sync** below for how data still gets backed up and can follow you across devices.

## Stack

React + TypeScript + Vite, Tailwind CSS, `date-fns`, `vite-plugin-pwa`.

State is local component state + `localStorage` via a custom hook (`src/lib/useAppState.ts`) — this stays the source of truth and is what makes the app work fully offline. On top of that, `src/lib/sync.ts` backs the same state up to [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/) through a Netlify Function (`netlify/functions/sync.mts`), so a cleared cache or a second device isn't necessarily the end of a streak.

### How sync works

- On first load, the app generates a random device ID (`localStorage`, key `kratos:device-id`) — there's no login, so this ID is what a blob is filed under.
- Whenever online, local state is pushed to `/api/sync?deviceId=...` (debounced) and pulled + merged on load. The merge is additive only — check-ins union by date, milestones union by id — so syncing can never lose data on either side.
- To carry a streak to another device: open **Settings** on the original device, copy the **Sync ID**, and paste it into **Settings → Link** on the other device. Both devices now read/write the same blob.
- This is a convenience, not durability: the device ID itself lives in `localStorage`, so clearing that on every device that knows it does lose access to the blob. Export/Import (also in Settings) remains the belt-and-suspenders backup.
- The sync endpoint is intentionally unauthenticated (no accounts, by design) — it validates shape and caps payload size, but anyone who guesses or brute-forces a device ID could read or overwrite that blob. Treat the device ID like a share link, not a password.

## Develop

```sh
npm install
npm run dev
```

`npm run dev` alone serves the SPA but not `/api/sync` (there's no Netlify Function runtime behind plain Vite). To exercise sync locally, run the Netlify Function server alongside it — `vite.config.ts` already proxies `/api/*` to it:

```sh
npx netlify functions:serve --port 9999   # in one terminal
npm run dev                               # in another
```

(`netlify dev` also works if its Edge Functions bootstrap can reach the network; `functions:serve` avoids that dependency and is what this was verified against.)

## Test

```sh
npm test
```

Pure date/streak/freeze/sync-merge logic lives in `src/lib/` with unit tests in `src/lib/__tests__/`. The sync Function itself is tested in `netlify/functions/__tests__/sync.test.ts` with `@netlify/blobs` mocked.

## Build

```sh
npm run build
```

Static output in `dist/`, deployed to Netlify (see `netlify.toml`) alongside the `netlify/functions` Function — no separate backend to run, but Netlify Blobs means the site is no longer a pure static deploy.
