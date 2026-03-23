# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── mobile/             # Expo React Native app (RouteOpt)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts
├── pnpm-workspace.yaml     # pnpm workspace
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Mobile App: RouteOpt (artifacts/mobile)

Route optimization app for field sales reps. Built with Expo + React Native.

### Features
- Add customer stops with name, address, notes
- Auto-optimize route order (nearest neighbor TSP algorithm)
- Navigate to stops via Google Maps / native maps
- Visit status management: planned → active → visited
- Day history with progress stats
- Data persisted with AsyncStorage

### Architecture
- `context/RouteContext.tsx` - Main state management (AsyncStorage + React context)
- `app/(tabs)/index.tsx` - Main route screen
- `app/(tabs)/history.tsx` - History screen
- `app/add-stop.tsx` - Add stop sheet (formSheet modal)
- `components/StopCard.tsx` - Individual stop card
- `components/StatsBar.tsx` - Progress statistics bar
- `components/MapView.tsx` - Route overview + navigation button
- `constants/colors.ts` - App theme (blue accent, clean light theme)

### Dependencies
- `@react-native-async-storage/async-storage` - Local persistence
- `@nkzw/create-context-hook` - Context hook factory
- `expo-haptics` - Haptic feedback
- `react-native-maps@1.18.0` - Maps (pinned for Expo Go compatibility)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/`.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec and Orval config. Run codegen: `pnpm --filter @workspace/api-spec run codegen`
