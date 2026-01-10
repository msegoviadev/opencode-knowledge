/**
 * File utilities for JSONL persistence
 */

import { appendFileSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const TRACKER_DIR = '.opencode/knowledge/tracker';

/**
 * Ensure tracker directory exists
 */
export function ensureTrackerDir(): void {
  if (!existsSync(TRACKER_DIR)) {
    mkdirSync(TRACKER_DIR, { recursive: true });
  }
}

/**
 * Append to JSONL file
 */
export function appendJsonl(filename: string, data: any): void {
  ensureTrackerDir();
  const filePath = join(TRACKER_DIR, filename);
  const line = JSON.stringify(data) + '\n';
  appendFileSync(filePath, line, 'utf-8');
}

/**
 * Read last line from JSONL file
 */
export function readLastJsonl(filename: string): any | null {
  const filePath = join(TRACKER_DIR, filename);

  if (!existsSync(filePath)) {
    return null;
  }

  const content = readFileSync(filePath, 'utf-8').trim();
  if (!content) return null;

  const lines = content.split('\n');
  const lastLine = lines[lines.length - 1];

  try {
    return JSON.parse(lastLine);
  } catch {
    return null;
  }
}

/**
 * Read all lines from JSONL file
 */
export function readAllJsonl(filename: string): any[] {
  const filePath = join(TRACKER_DIR, filename);

  if (!existsSync(filePath)) {
    return [];
  }

  const content = readFileSync(filePath, 'utf-8').trim();
  if (!content) return [];

  const lines = content.split('\n');
  const results: any[] = [];

  for (const line of lines) {
    try {
      results.push(JSON.parse(line));
    } catch {
      // Skip malformed lines
    }
  }

  return results;
}

/**
 * Clear JSONL file
 */
export function clearJsonl(filename: string): void {
  ensureTrackerDir();
  const filePath = join(TRACKER_DIR, filename);
  writeFileSync(filePath, '', 'utf-8');
}
