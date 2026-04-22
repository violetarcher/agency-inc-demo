import fs from 'fs';
import path from 'path';

// File-based storage for revoked sessions - use a persistent location outside .next
const REVOKED_SESSIONS_FILE = path.join(process.cwd(), 'revoked-sessions.json');

// Ensure the revoked sessions file exists
function ensureFileExists() {
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
    console.error(`❌ Error loading revoked sessions:`, error);
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
  console.log(`🔒 Adding session to revoked list: ${sessionId}`);
  const revokedSessions = loadRevokedSessions();
  revokedSessions.add(sessionId);
  saveRevokedSessions(revokedSessions);
  console.log(`🔒 Total revoked sessions: ${revokedSessions.size}`);
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