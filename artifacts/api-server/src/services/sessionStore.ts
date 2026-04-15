/**
 * In-memory session store for episode processing sessions.
 * Each session tracks chunks, status, and final results.
 * No database required — sessions live in memory.
 */

export type SessionStatus =
  | "pending"
  | "processing"
  | "complete"
  | "error";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WordResult {
  word: string;           // original English word
  translation: string;    // Arabic translation
  pronunciation: string;  // phonetic pronunciation for TTS
  boundingBox: BoundingBox; // position on the image
}

export interface ImageResult {
  imageIndex: number;     // order in the episode
  imageUrl: string;       // cloudinary URL
  words: WordResult[];    // all detected/translated words
}

export interface Session {
  sessionId: string;
  episodeUrl: string;
  sourceLang: string;
  targetLang: string;
  totalImages: number;
  processedImages: number;
  status: SessionStatus;
  error?: string;
  results: ImageResult[];
  createdAt: Date;
  updatedAt: Date;
}

// In-memory map: sessionId → Session
const sessions = new Map<string, Session>();

/** Create a new session and return its ID */
export function createSession(
  sessionId: string,
  episodeUrl: string,
  totalImages: number,
  sourceLang = "en",
  targetLang = "ar"
): Session {
  const session: Session = {
    sessionId,
    episodeUrl,
    sourceLang,
    targetLang,
    totalImages,
    processedImages: 0,
    status: "pending",
    results: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  sessions.set(sessionId, session);
  return session;
}

/** Get a session by ID */
export function getSession(sessionId: string): Session | undefined {
  return sessions.get(sessionId);
}

/** Update a session's status and processed count */
export function updateSession(sessionId: string, updates: Partial<Session>): Session | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;

  const updated = { ...session, ...updates, updatedAt: new Date() };
  sessions.set(sessionId, updated);
  return updated;
}

/** Delete a session (cleanup) */
export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}
