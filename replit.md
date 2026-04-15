# WebtoonTranslate Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains:
- **API Server** (`artifacts/api-server`) — Express 5 backend for OCR + translation pipeline
- **Chrome Extension** (`apps/extension`) — Manifest V3 extension with React popup and content scripts

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 + Zod validation
- **Build**: esbuild (API), Vite (extension)

## Key Commands

- `pnpm --filter @workspace/api-server run dev` — run API server locally (port 5000)
- `pnpm --filter @workspace/api-server run build` — build API server
- `pnpm --filter @workspace/extension run build` — build Chrome extension to `apps/extension/dist/`
- `pnpm --filter @workspace/extension run dev` — build extension in watch mode

## Project Structure

```
apps/
  extension/              # Chrome Extension (Manifest V3)
    manifest.json         # Extension manifest
    popup.html            # Popup entry point
    src/
      popup/              # React popup UI (screens: Landing, Home, Detection, Processing, Complete)
      content/            # Content script (detector, overlay, index)
      background/         # Service worker
      storage/            # IndexedDB caching
      api/                # API client
      types.ts            # Shared types

artifacts/
  api-server/             # Express 5 backend
    src/
      routes/
        episodes.ts       # POST /prepare, /chunks, /complete, GET /status, /result
        health.ts         # GET /healthz
      services/
        sessionStore.ts   # In-memory session management
        ocrService.ts     # OCR (mock → Google Vision)
        translationService.ts  # Translation (mock → Google Translate)
        cloudinaryService.ts   # Image upload (mock → Cloudinary)
        processingService.ts   # Orchestrates the full pipeline
```

## API Routes

```
POST /api/episodes/prepare           → Create processing session
POST /api/episodes/:id/chunks        → Upload image batch (max 3)
POST /api/episodes/:id/complete      → Signal all chunks sent
GET  /api/episodes/:id/status        → Poll processing progress
GET  /api/episodes/:id/result        → Fetch final translated data
```

## Loading the Extension in Chrome

1. Run `pnpm --filter @workspace/extension run build`
2. Open Chrome → `chrome://extensions`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `apps/extension/dist/` folder

## Plugging in Real APIs

### Google Vision OCR
See `artifacts/api-server/src/services/ocrService.ts` — clearly marked MOCK section

### Google Cloud Translation
See `artifacts/api-server/src/services/translationService.ts` — clearly marked MOCK section

### Cloudinary Image Storage
See `artifacts/api-server/src/services/cloudinaryService.ts` — clearly marked MOCK section

## Environment Variables

Copy `artifacts/api-server/.env.example` to `artifacts/api-server/.env` and fill in values.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
