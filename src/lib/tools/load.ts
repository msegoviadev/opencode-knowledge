/**
 * Tool: knowledge_load
 * Load one or more knowledge packages from the vault into the current session context
 */

import { tool } from '@opencode-ai/plugin';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const VAULT_DIR = '.opencode/knowledge/vault';

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
    const packagePaths = args.paths
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    if (packagePaths.length === 0) {
      return 'No package paths provided';
    }

    const loaded = [];
    const failed = [];

    for (const packagePath of packagePaths) {
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
      output += `✅ Loaded ${loaded.length}/${packagePaths.length} packages:\n\n`;
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
