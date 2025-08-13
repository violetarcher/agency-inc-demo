import fs from 'fs';
import path from 'path';

// File-based storage for revoked sessions
const REVOKED_SESSIONS_FILE = path.join(process.cwd(), '.next', 'revoked-sessions.json');

// Ensure the .next directory exists
function ensureFileExists() {
  const dir = path.dirname(REVOKED_SESSIONS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(REVOKED_SESSIONS_FILE)) {
    fs.writeFileSync(REVOKED_SESSIONS_FILE, JSON.stringify([]));
  }
}

// Load revoked sessions from file
function loadRevokedSessions(): Set<string> {
  try {
    ensureFileExists();
    const data = fs.readFileSync(REVOKED_SESSIONS_FILE, 'utf-8');
    const sessions = JSON.parse(data);
    return new Set(sessions);
  } catch (error) {
    return new Set();
  }
}

// Save revoked sessions to file
function saveRevokedSessions(sessions: Set<string>) {
  try {
    ensureFileExists();
    fs.writeFileSync(REVOKED_SESSIONS_FILE, JSON.stringify(Array.from(sessions)));
  } catch (error) {
    // Silently handle file write errors
  }
}

// Function to add revoked session
export function addRevokedSession(sessionId: string) {
  const revokedSessions = loadRevokedSessions();
  revokedSessions.add(sessionId);
  saveRevokedSessions(revokedSessions);
}

// Function to check if session is revoked
export function isSessionRevoked(sessionId: string): boolean {
  const revokedSessions = loadRevokedSessions();
  return revokedSessions.has(sessionId);
}

// Function to remove session from revoked list (for cleanup)
export function removeRevokedSession(sessionId: string) {
  const revokedSessions = loadRevokedSessions();
  revokedSessions.delete(sessionId);
  saveRevokedSessions(revokedSessions);
}

// Function to get all revoked sessions (for debugging)
export function getAllRevokedSessions(): string[] {
  const revokedSessions = loadRevokedSessions();
  return Array.from(revokedSessions);
}