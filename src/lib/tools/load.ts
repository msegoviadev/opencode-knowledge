/**
 * Tool: knowledge_load
 * Load one or more knowledge packages from the vault into the current session context
 */

import { tool } from '@opencode-ai/plugin';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parseFrontmatter } from '../frontmatter-parser.js';

const VAULT_DIR = '.opencode/knowledge/vault';

/**
 * Recursively resolve package dependencies
 * Returns packages in dependency order (dependencies first)
 */
function resolveDependencies(
  packagePath: string,
  vaultDir: string,
  loaded: Set<string> = new Set()
): string[] {
  // Prevent circular dependencies
  if (loaded.has(packagePath)) {
    return [];
  }

  loaded.add(packagePath);
  const result: string[] = [];

  // Normalize path (add .md if missing)
  const normalizedPath = packagePath.endsWith('.md') ? packagePath : `${packagePath}.md`;
  const fullPath = join(vaultDir, normalizedPath);

  if (!existsSync(fullPath)) {
    return [];
  }

  try {
    // Parse frontmatter to check for dependencies
    const content = readFileSync(fullPath, 'utf-8');
    const { frontmatter } = parseFrontmatter(content);

    // Recursively load dependencies first
    if (frontmatter.required_knowledge && Array.isArray(frontmatter.required_knowledge)) {
      for (const dep of frontmatter.required_knowledge) {
        const depPath = dep.endsWith('.md') ? dep : `${dep}.md`;
        const depPackages = resolveDependencies(depPath, vaultDir, loaded);
        result.push(...depPackages);
      }
    }

    // Then add this package
    result.push(normalizedPath);
  } catch {
    // If we can't read/parse, skip this package
    return [];
  }

  return result;
}

export const knowledgeLoadTool = tool({
  description:
    'Load one or more knowledge packages from the vault into the current session context. The package content will be available for reference in subsequent responses.',
  args: {
    paths: tool.schema
      .string()
      .describe(
        "Comma-separated package paths relative to vault (e.g., 'standards/code-conventions.md,frontend/react-patterns.md')"
      ),
  },
  async execute(args) {
    const requestedPaths = args.paths
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    if (requestedPaths.length === 0) {
      return 'No package paths provided';
    }

    // Resolve all dependencies recursively
    const allPackagePaths = new Set<string>();
    const loadedTracker = new Set<string>();

    for (const path of requestedPaths) {
      const resolved = resolveDependencies(path, VAULT_DIR, loadedTracker);
      resolved.forEach((p) => allPackagePaths.add(p));
    }

    // Load all packages in dependency order
    const loaded = [];
    const failed = [];
    const packageArray = Array.from(allPackagePaths);

    for (const packagePath of packageArray) {
      const fullPath = join(VAULT_DIR, packagePath);

      if (!existsSync(fullPath)) {
        failed.push(`⚠️  Package not found: ${packagePath}`);
        continue;
      }

      try {
        const content = readFileSync(fullPath, 'utf-8');
        loaded.push(`## Knowledge: ${packagePath}\n\n${content}`);
      } catch (error) {
        failed.push(`❌ Failed to load ${packagePath}: ${error}`);
      }
    }

    let output = '';

    if (loaded.length > 0) {
      const totalCount = packageArray.length;
      const requestedCount = requestedPaths.length;
      const depsCount = totalCount - requestedCount;

      if (depsCount > 0) {
        output += `✅ Loaded ${loaded.length}/${totalCount} packages (${requestedCount} requested + ${depsCount} dependencies):\n\n`;
      } else {
        output += `✅ Loaded ${loaded.length}/${totalCount} packages:\n\n`;
      }
      output += loaded.join('\n\n---\n\n');
    }

    if (failed.length > 0) {
      if (loaded.length > 0) {
        output += '\n\n';
      }
      output += failed.join('\n');
    }

    if (loaded.length === 0 && failed.length > 0) {
      return failed.join('\n');
    }

    return output;
  },
});
