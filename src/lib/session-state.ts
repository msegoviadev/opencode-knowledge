/**
 * Session state management for the knowledge system
 */

import type { SessionState } from './types.js';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

const sessionStates = new Map<string, SessionState>();

/**
 * Create a new session state
 * Loads role from settings.json
 * @throws Error if state already exists for this session
 * @throws Error if settings.json is missing or invalid
 */
export async function createSessionState(sessionId: string): Promise<void> {
  if (sessionStates.has(sessionId)) {
    throw new Error(`Session state already exists for session: ${sessionId}`);
  }

  const settingsPath = '.opencode/knowledge/settings.json';

  if (!existsSync(settingsPath)) {
    throw new Error(
      `CONFIGURATION ERROR: Cannot create session state - settings file not found at ${settingsPath}`
    );
  }

  let role: string;
  try {
    const settingsContent = await readFile(settingsPath, 'utf-8');
    const settings = JSON.parse(settingsContent);

    if (!settings.role) {
      throw new Error(
        `CONFIGURATION ERROR: Cannot create session state - missing 'role' field in ${settingsPath}`
      );
    }

    role = settings.role;
  } catch (error) {
    if (error instanceof Error && error.message.includes('CONFIGURATION ERROR')) {
      throw error;
    }
    throw new Error(`Error reading settings.json: ${error}`);
  }

  const state: SessionState = {
    role,
    isFirstPrompt: true,
    loadedPackages: new Set(),
    createdAt: new Date(),
  };

  sessionStates.set(sessionId, state);
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
