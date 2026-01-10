/**
 * Knowledge catalog builder and loader
 */

/* eslint-disable no-console */

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { join, relative } from 'path';
import { parseFrontmatter } from './frontmatter-parser.js';
import type { KnowledgeCatalog } from './types.js';

const VAULT_DIR = '.opencode/knowledge/vault';
const CATALOG_PATH = '.opencode/knowledge/knowledge.json';

/**
 * Recursively scan vault for markdown files
 */
function* scanVault(dir: string): Generator<string> {
  if (!existsSync(dir)) return;

  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      yield* scanVault(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      yield fullPath;
    }
  }
}

/**
 * Build knowledge catalog from vault
 */
export function buildKnowledgeCatalog(): KnowledgeCatalog {
  const catalog: KnowledgeCatalog = {
    knowledge: {},
    built_at: new Date().toISOString(),
  };

  for (const filePath of scanVault(VAULT_DIR)) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const { frontmatter } = parseFrontmatter(content);

      if (!frontmatter.tags || !frontmatter.category) {
        console.warn(`[knowledge] Skipping ${filePath}: missing tags or category`);
        continue;
      }

      const relativePath = relative(VAULT_DIR, filePath);
      const category = frontmatter.category;

      if (!catalog.knowledge[category]) {
        catalog.knowledge[category] = {};
      }

      const packageName = relativePath.replace(/\.md$/, '').replace(/\//g, '-');

      catalog.knowledge[category][packageName] = {
        tags: frontmatter.tags,
        description: frontmatter.description || '',
        category,
        path: relativePath,
        required_knowledge: frontmatter.required_knowledge,
      };
    } catch (error) {
      console.error(`[knowledge] Error processing ${filePath}:`, error);
    }
  }

  return catalog;
}

/**
 * Save catalog to disk
 */
export function saveCatalog(catalog: KnowledgeCatalog): void {
  writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), 'utf-8');
}

/**
 * Load catalog from disk
 */
export function loadCatalog(): KnowledgeCatalog | null {
  if (!existsSync(CATALOG_PATH)) {
    return null;
  }

  try {
    const content = readFileSync(CATALOG_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Check if catalog needs rebuild
 */
export function catalogNeedsRebuild(): boolean {
  if (!existsSync(CATALOG_PATH)) return true;
  if (!existsSync(VAULT_DIR)) return false;

  try {
    const catalogStat = statSync(CATALOG_PATH);
    const catalogMtime = catalogStat.mtimeMs;

    // Check if any vault file is newer than catalog
    for (const filePath of scanVault(VAULT_DIR)) {
      const fileStat = statSync(filePath);
      if (fileStat.mtimeMs > catalogMtime) {
        return true;
      }
    }

    return false;
  } catch {
    return true;
  }
}
