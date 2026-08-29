# Kratos

A dead-simple gym habit tracker. Open the app, tap one big button to mark today's workout done. Everything else — streaks, streak-freezes, milestones — wraps around that single action.

No workout logging, no sets/reps, no exercise library, no accounts. Everything lives on-device.

## Stack

React + TypeScript + Vite, Tailwind CSS, `date-fns`, `vite-plugin-pwa`. State is local component state + `localStorage` via a custom hook (`src/lib/useAppState.ts`). No backend.

## Develop

```sh
npm install
npm run dev
```

## Test

```sh
npm test
```

Pure date/streak/freeze logic lives in `src/lib/` with unit tests in `src/lib/__tests__/` covering the streak and streak-freeze edge cases.

## Build

```sh
npm run build
```

Static output in `dist/`, deployed as-is to Netlify (see `netlify.toml`) — no functions, no env vars.
