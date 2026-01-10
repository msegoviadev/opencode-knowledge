/**
 * Tag-based knowledge search
 */

import { loadCatalog } from './knowledge-catalog.js';
import type { SearchResult } from './types.js';

/**
 * Search knowledge packages by tags
 */
export function searchKnowledge(tags: string[]): SearchResult[] {
  const catalog = loadCatalog();
  if (!catalog) {
    throw new Error('Knowledge catalog not found. Run /index-knowledge first.');
  }

  const results: SearchResult[] = [];
  const searchTags = new Set(tags.map((t) => t.toLowerCase()));

  for (const packages of Object.values(catalog.knowledge)) {
    for (const pkg of Object.values(packages)) {
      const packageTags = new Set(pkg.tags.map((t) => t.toLowerCase()));
      const matchedTags = tags.filter((t) => packageTags.has(t.toLowerCase()));

      if (matchedTags.length > 0) {
        // Simple relevance: ratio of matched tags
        const relevance = matchedTags.length / Math.max(searchTags.size, packageTags.size);

        results.push({
          path: pkg.path,
          relevance_score: relevance,
          matched_tags: matchedTags,
          description: pkg.description,
        });
      }
    }
  }

  // Sort by relevance (highest first)
  results.sort((a, b) => b.relevance_score - a.relevance_score);

  return results;
}

/**
 * Build category-tag map for discovery
 */
export function buildCategoryTagMap(): Record<string, string[]> {
  const catalog = loadCatalog();
  if (!catalog) return {};

  const categoryTagMap: Record<string, string[]> = {};

  for (const [category, packages] of Object.entries(catalog.knowledge)) {
    const tagSet = new Set<string>();

    for (const pkg of Object.values(packages)) {
      pkg.tags.forEach((tag) => tagSet.add(tag));
    }

    if (tagSet.size > 0) {
      categoryTagMap[category] = Array.from(tagSet).sort();
    }
  }

  return categoryTagMap;
}

/**
 * Format category-tag map as compact text
 */
export function formatCategoryTagMap(categoryTagMap: Record<string, string[]>): string {
  const lines = [];

  for (const [category, tags] of Object.entries(categoryTagMap)) {
    // Show category with top 5 most common tags
    const topTags = tags.slice(0, 5);
    const more = tags.length > 5 ? ` +${tags.length - 5} more` : '';
    lines.push(`  ${category} [${topTags.join(', ')}${more}]`);
  }

  return lines.join('\n');
}
