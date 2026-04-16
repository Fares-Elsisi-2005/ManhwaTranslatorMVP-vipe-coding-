# Webtoon Translator Companion

A comprehensive monorepo for a Webtoon translation ecosystem. This project consists of a Chrome Extension that identifies panels on Webtoons.com and a backend API server that performs OCR and translation.

## Project Overview

- **Monorepo Manager**: `pnpm` workspaces.
- **Chrome Extension (`apps/extension`)**: 
  - **Framework**: React 19 (TypeScript).
  - **Build Tools**: Vite for the popup UI; `esbuild` for content and background scripts (to ensure non-module compatibility with Chrome).
  - **Features**: Image detection on Webtoons.com, side panel persistent UI, "Processing" overlay, word-by-word interactive translation, and PDF downloading via `jsPDF`.
- **API Server (`artifacts/api-server`)**:
  - **Framework**: Express (TypeScript).
  - **Pipeline**: Uploads images to Cloudinary -> Performs Google Vision OCR -> Translates unique words via Google Translate -> Returns structured data.
  - **Mock Mode**: Currently, OCR and Translation services are **mocked** to allow for UI/UX testing without active Google Cloud billing.
- **Shared Libraries (`lib/`)**:
  - `api-client-react`: Generated client for backend communication.
  - `api-spec`: OpenAPI specification and Orval configuration.
  - `api-zod`: Zod schemas for API validation.
  - `db`: Drizzle ORM setup (not actively used by the current in-memory session store).

## Building and Running

### Prerequisites
- **Node.js**: v24 (recommended).
- **pnpm**: Global installation required.

### 1. Backend Server
To start the backend in development mode (port 5000):
```powershell
# From the project root
cd artifacts/api-server
pnpm run dev
```
Verify the server is up by visiting `http://localhost:5000/api/healthz`.

### 2. Chrome Extension
To build the extension assets:
```powershell
# From the project root
pnpm --filter @workspace/extension run build
```
The build output will be in `apps/extension/dist`.

### 3. Loading the Extension
1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `apps/extension/dist` directory.
4. **Note**: The extension is configured as a **Side Panel**. Click the extension icon to open the sidebar.

## Development Conventions

- **Windows Compatibility**: Always use PowerShell-friendly commands. Avoid `export`, `&&`, or Unix-style pathing in scripts.
- **Extension Script Bundling**: `content.js` and `background.js` MUST be bundled via `esbuild` into single-file IIFEs to avoid `Uncaught SyntaxError: Unexpected token 'export'` in Chrome's non-module content script environment.
- **API Payload Limit**: The backend is configured with a **50MB** JSON limit to accommodate large base64 image uploads from the extension.
- **Mock Services**: When testing without billing, ensure `ocrService.ts` and `translationService.ts` use the `_MOCK` or `MOCK` implementation paths.
- **Secrets Management**: Credentials (Cloudinary, Google Service Account) are stored in `artifacts/api-server/.env`. **NEVER** commit this file.

## Troubleshooting

- **CSP Errors**: `jsPDF` is bundled locally to avoid Content Security Policy (CSP) blocks on Webtoons.com.
- **Popup Closing**: The extension is configured as a `side_panel`. If it still closes like a popup, "Remove" and "Re-add" the extension in `chrome://extensions/` to refresh the manifest behavior.
- **413 Payload Too Large**: If this occurs, verify that the `express.json({ limit: "50mb" })` middleware is active in `app.ts`.
