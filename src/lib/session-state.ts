/**
 * Session state management for the knowledge system
 */

import type { SessionState } from './types.js';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { appendJsonl, readLastJsonl } from './file-utils.js';

const sessionStates = new Map<string, SessionState>();
const SESSION_STATE_FILE = 'session-state.jsonl';

/**
 * Load session state from file
 */
function loadSessionStateFromFile(sessionId: string): SessionState | null {
  const state = readLastJsonl(SESSION_STATE_FILE);

  if (!state || state.sessionId !== sessionId) {
    return null;
  }

  return {
    role: state.role,
    isFirstPrompt: state.isFirstPrompt,
    loadedPackages: new Set(state.loadedPackages || []),
    createdAt: new Date(state.createdAt),
    categoriesShown: state.categoriesShown,
  };
}

/**
 * Persist session state to file
 */
function persistSessionState(sessionId: string, state: SessionState): void {
  appendJsonl(SESSION_STATE_FILE, {
    sessionId,
    role: state.role,
    isFirstPrompt: state.isFirstPrompt,
    loadedPackages: Array.from(state.loadedPackages),
    createdAt: state.createdAt.toISOString(),
    categoriesShown: state.categoriesShown,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Create a new session state
 * Loads role from settings.json if present
 * @throws Error if settings.json exists but cannot be read/parsed
 */
export async function createSessionState(sessionId: string): Promise<void> {
  // Try loading from file first
  const existingState = loadSessionStateFromFile(sessionId);

  if (existingState) {
    sessionStates.set(sessionId, existingState);
    return;
  }

  const settingsPath = '.opencode/knowledge/settings.json';
  let role: string | null = null;

  // Only try to load role if settings.json exists
  if (existsSync(settingsPath)) {
    try {
      const settingsContent = await readFile(settingsPath, 'utf-8');
      const settings = JSON.parse(settingsContent);
      role = settings.role || null;
    } catch (error) {
      throw new Error(`Error reading settings.json: ${error}`);
    }
  }

  const state: SessionState = {
    role,
    isFirstPrompt: true,
    loadedPackages: new Set(),
    createdAt: new Date(),
    categoriesShown: false,
  };

  sessionStates.set(sessionId, state);
  persistSessionState(sessionId, state);
}

/**
 * Get existing session state
 * @throws Error if state doesn't exist for this session
 */
export function getSessionState(sessionId: string): SessionState {
  const state = sessionStates.get(sessionId);

  if (!state) {
    throw new Error(`Session state not found for session: ${sessionId}`);
  }

  return state;
}

/**
 * Update session state
 * @throws Error if state doesn't exist for this session
 */
export function updateSessionState(sessionId: string, updates: Partial<SessionState>): void {
  const state = getSessionState(sessionId); // This will throw if not found
  Object.assign(state, updates);
  persistSessionState(sessionId, state);
}

/**
 * Delete session state
 */
export function deleteSessionState(sessionId: string): void {
  sessionStates.delete(sessionId);
}

/**
 * Check if session state exists
 */
export function hasSessionState(sessionId: string): boolean {
  return sessionStates.has(sessionId);
}
