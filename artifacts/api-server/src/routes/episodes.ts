/**
 * Episode routes — handle the full OCR + translation pipeline.
 *
 * Flow:
 * POST /api/episodes/prepare          → create session
 * POST /api/episodes/:id/chunks       → upload image batch (3 at a time)
 * POST /api/episodes/:id/complete     → signal all chunks sent
 * GET  /api/episodes/:id/status       → poll processing progress
 * GET  /api/episodes/:id/result       → fetch final translated data
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import {
  createSession,
  getSession,
} from "../services/sessionStore.js";
import { processChunk, finalizeSession } from "../services/processingService.js";

const router: IRouter = Router();

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/episodes/prepare
// Creates a new processing session for an episode.
// ──────────────────────────────────────────────────────────────────────────────
const PrepareBody = z.object({
  episodeUrl: z.string().url(),
  totalImages: z.number().int().positive(),
  sourceLang: z.string().default("en"),
  targetLang: z.string().default("ar"),
});

router.post("/prepare", async (req: Request, res: Response) => {
  const parsed = PrepareBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    return;
  }

  const { episodeUrl, totalImages, sourceLang, targetLang } = parsed.data;
  const sessionId = randomUUID();

  const session = createSession(sessionId, episodeUrl, totalImages, sourceLang, targetLang);

  req.log.info({ sessionId, totalImages }, "Episode session created");

  res.status(201).json({
    sessionId: session.sessionId,
    status: session.status,
    totalImages: session.totalImages,
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/episodes/:sessionId/chunks
// Upload a batch of images (up to 3) for processing.
// Processing starts async — client should poll /status.
// ──────────────────────────────────────────────────────────────────────────────
const ChunkBody = z.object({
  images: z
    .array(
      z.object({
        imageIndex: z.number().int().min(0),
        base64: z.string().min(1), // base64-encoded image
      })
    )
    .min(1)
    .max(3), // enforce 3 images per chunk max
});

router.post("/:sessionId/chunks", async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  const session = getSession(sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  if (session.status === "error") {
    res.status(409).json({ error: "Session is in error state" });
    return;
  }

  const parsed = ChunkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid chunk body", details: parsed.error.issues });
    return;
  }

  const { images } = parsed.data;

  req.log.info({ sessionId, count: images.length }, "Received image chunk");

  // Start processing async — don't await so client gets immediate response
  processChunk(sessionId, images).catch((err) => {
    req.log.error({ sessionId, err }, "Async chunk processing failed");
  });

  res.status(202).json({
    sessionId,
    accepted: images.length,
    message: "Chunk accepted — processing started",
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/episodes/:sessionId/complete
// Signal that all chunks have been sent.
// Server checks if processing is done and marks session complete.
// ──────────────────────────────────────────────────────────────────────────────
router.post("/:sessionId/complete", (req: Request, res: Response) => {
  const { sessionId } = req.params;

  const session = getSession(sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  req.log.info({ sessionId }, "All chunks submitted — finalizing");

  // Attempt to finalize (marks complete if all images are done)
  finalizeSession(sessionId);

  const updated = getSession(sessionId);
  res.json({
    sessionId,
    status: updated?.status ?? "processing",
    processedImages: updated?.processedImages ?? 0,
    totalImages: updated?.totalImages ?? 0,
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/episodes/:sessionId/status
// Poll to check processing progress.
// ──────────────────────────────────────────────────────────────────────────────
router.get("/:sessionId/status", (req: Request, res: Response) => {
  const { sessionId } = req.params;

  const session = getSession(sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  // Auto-complete if all images done but not yet finalized
  if (
    session.status === "processing" &&
    session.processedImages >= session.totalImages
  ) {
    finalizeSession(sessionId);
  }

  const updated = getSession(sessionId);

  res.json({
    sessionId,
    status: updated?.status,
    processedImages: updated?.processedImages ?? 0,
    totalImages: updated?.totalImages ?? 0,
    progress: updated
      ? Math.round((updated.processedImages / updated.totalImages) * 100)
      : 0,
    error: updated?.error,
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/episodes/:sessionId/result
// Fetch the final structured result (only when status === 'complete').
// ──────────────────────────────────────────────────────────────────────────────
router.get("/:sessionId/result", (req: Request, res: Response) => {
  const { sessionId } = req.params;

  const session = getSession(sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  if (session.status !== "complete") {
    res.status(202).json({
      error: "Processing not complete",
      status: session.status,
      processedImages: session.processedImages,
      totalImages: session.totalImages,
    });
    return;
  }

  // Sort results by imageIndex so overlay rendering is in order
  const sortedResults = [...session.results].sort(
    (a, b) => a.imageIndex - b.imageIndex
  );

  res.json({
    sessionId,
    episodeUrl: session.episodeUrl,
    sourceLang: session.sourceLang,
    targetLang: session.targetLang,
    totalImages: session.totalImages,
    images: sortedResults,
  });
});

export default router;
