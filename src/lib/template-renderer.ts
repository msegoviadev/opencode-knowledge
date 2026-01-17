/**
 * Template rendering utilities
 */

import type { TemplateVariables } from './types.js';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Render template with variable substitution
 */
export function renderTemplate(templateContent: string, variables: TemplateVariables): string {
  let rendered = templateContent;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    rendered = rendered.replaceAll(placeholder, String(value));
  }

  return rendered;
}

/**
 * Load and render template file
 */
export async function loadAndRenderTemplate(
  templateName: string,
  variables: TemplateVariables
): Promise<string> {
  // First try user config directory
  let templatePath = join('.opencode', 'knowledge', 'templates', templateName);

  if (!existsSync(templatePath)) {
    // Fallback to bundled templates
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    templatePath = join(__dirname, '..', 'templates', templateName);

    if (!existsSync(templatePath)) {
      // Try one more level up for bundled dist structure
      templatePath = join(__dirname, 'templates', templateName);
    }
  }

  if (!existsSync(templatePath)) {
    throw new Error(`Template not found: ${templateName}`);
  }

  const content = await readFile(templatePath, 'utf-8');
  return renderTemplate(content, variables);
}

/**
 * Escape special characters in prompt text
 */
export function escapePrompt(text: string): string {
  // Escape special characters that might break bash command injection
  return text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$')
    .replace(/`/g, '\\`');
}

/**
 * Get core knowledge packages (always recommended)
 */
export function getCorePackages(): { tags: string[]; packages: string[] } {
  return {
    tags: ['standards', 'typescript', 'testing', 'patterns'],
    packages: ['code-conventions', 'component-architecture', 'testing-basics'],
  };
}
