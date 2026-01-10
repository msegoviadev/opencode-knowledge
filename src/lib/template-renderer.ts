/**
 * Template rendering utilities
 */

/* eslint-disable no-console */

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
 * Load personality template
 */
export async function loadPersonality(role: string): Promise<string> {
  // First try user config directory
  let personalityPath = join('.opencode', 'knowledge', 'templates', 'personalities', `${role}.txt`);

  if (!existsSync(personalityPath)) {
    console.warn(`[template-renderer] Personality not found: ${role}, trying bundled defaults`);

    // Fallback to bundled templates
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    personalityPath = join(__dirname, '..', 'templates', 'personalities', `${role}.txt`);

    if (!existsSync(personalityPath)) {
      // Try one more level up for bundled dist structure
      personalityPath = join(__dirname, 'templates', 'personalities', `${role}.txt`);
    }
  }

  // If still not found, try staff_engineer as ultimate fallback
  if (!existsSync(personalityPath) && role !== 'staff_engineer') {
    console.warn(`[template-renderer] Falling back to staff_engineer personality`);
    return loadPersonality('staff_engineer');
  }

  if (!existsSync(personalityPath)) {
    // Final fallback to hardcoded default
    return 'Act as a Staff Engineer reviewing engineering work. Assume competence. Be skeptical, precise, and pragmatic.';
  }

  const content = await readFile(personalityPath, 'utf-8');
  return content.trim();
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
