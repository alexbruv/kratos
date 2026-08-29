# Kratos

A dead-simple gym habit tracker. Open the app, tap one big button to mark today's workout done. Everything else — streaks, streak-freezes, milestones — wraps around that single action.

No workout logging, no sets/reps, no exercise library, no accounts. This build is intentionally single-user (see **Sync** below) — every device that opens it shares the same data automatically.

## Stack

React + TypeScript + Vite, Tailwind CSS, `date-fns`, `vite-plugin-pwa`.

State is local component state + `localStorage` via a custom hook (`src/lib/useAppState.ts`) — this stays the source of truth and is what makes the app work fully offline. On top of that, `src/lib/sync.ts` backs the same state up to [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/) through a Netlify Function (`netlify/functions/sync.mts`), so you can check in from your phone at the gym and see it reflected on your PC later, or the other way around.

### How sync works

- There's no login and this is built for one person, so every device reads/writes the *same* fixed blob (the id is a constant in `src/lib/sync.ts`) — open the app on a new device and it's already synced, no pairing step.
- Whenever online, local state is pushed (debounced) and pulled + merged on load. The merge never loses data: check-ins union by date; a reward you edited or deleted anywhere wins over a stale copy elsewhere (each edit is timestamped, and deletions are permanent tombstones so a sync can't resurrect something you removed).
- Since it's a single fixed id rather than a per-user secret, treat the deployed URL itself as the access boundary — anyone who can reach `/api/sync` on your deployment can read or overwrite your data. Fine for a private/personal deployment; don't make this build public without adding real auth.
- Sync is a convenience layer on top of localStorage, not a replacement for backups — Export/Import in Settings remains the belt-and-suspenders option (e.g. before clearing all site data on every device at once).

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
