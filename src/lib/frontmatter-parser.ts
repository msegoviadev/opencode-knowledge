/**
 * YAML frontmatter parser for markdown files
 */

import type { KnowledgeFrontmatter } from './types.js';

/**
 * Parse YAML frontmatter from markdown
 */
export function parseFrontmatter(content: string): {
  frontmatter: Partial<KnowledgeFrontmatter>;
  body: string;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, body: content.trim() };
  }

  const [, yamlContent, body] = match;
  const frontmatter: Partial<KnowledgeFrontmatter> = {};

  const lines = yamlContent.split('\n');
  let currentKey: string | null = null;
  let currentArray: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is an array item (  - value)
    const arrayItemMatch = line.match(/^\s+-\s+(.+)$/);
    if (arrayItemMatch && currentKey) {
      currentArray.push(arrayItemMatch[1].trim());
      continue;
    }

    // Flush current array if we have one
    if (currentKey && currentArray.length > 0) {
      (frontmatter as any)[currentKey] = currentArray;
      currentArray = [];
      currentKey = null;
    }

    // Parse key: value line
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Handle arrays
    if (key === 'tags' || key === 'required_knowledge' || key === 'file_patterns') {
      if (value === '') {
        // Array items on next lines
        currentKey = key;
        currentArray = [];
      } else if (value.startsWith('[') && value.endsWith(']')) {
        // Inline array [item1, item2]
        const items = value
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        (frontmatter as any)[key] = items;
      }
    } else if (key === 'description') {
      frontmatter.description = value;
    } else if (key === 'category') {
      frontmatter.category = value;
    }
  }

  // Flush any remaining array
  if (currentKey && currentArray.length > 0) {
    (frontmatter as any)[currentKey] = currentArray;
  }

  return { frontmatter, body: body.trim() };
}
