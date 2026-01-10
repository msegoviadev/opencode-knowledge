/**
 * Tool: knowledge_index
 * Rebuild the knowledge catalog by scanning the vault directory
 */

import { tool } from '@opencode-ai/plugin';
import { buildKnowledgeCatalog, saveCatalog } from '../knowledge-catalog.js';

export const knowledgeIndexTool = tool({
  description:
    'Rebuild the knowledge catalog by scanning the vault directory. Use this after adding new packages or if search results seem outdated. The catalog is automatically built on session start, so this is rarely needed.',
  args: {},
  async execute() {
    try {
      const catalog = buildKnowledgeCatalog();
      saveCatalog(catalog);

      const categoriesCount = Object.keys(catalog.knowledge).length;
      const packagesCount = Object.values(catalog.knowledge).reduce(
        (sum, packages) => sum + Object.keys(packages).length,
        0
      );

      return {
        success: true,
        categories: categoriesCount,
        packages: packagesCount,
        built_at: catalog.built_at,
        catalog_path: '.opencode/knowledge/knowledge.json',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
