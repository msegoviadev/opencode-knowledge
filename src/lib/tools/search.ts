/**
 * Tool: knowledge_search
 * Search the knowledge vault for packages matching specific tags
 */

import { tool } from '@opencode-ai/plugin';
import { searchKnowledge } from '../knowledge-search.js';
import { loadCatalog } from '../knowledge-catalog.js';

// const logToFile = async (message: string) => {
//   try {
//     const logEntry = `${new Date().toISOString()}: ${message}\n`;
//     let existing = '';
//     try {
//       existing = await Bun.file('/tmp/opencode-knowledge-debug.log').text();
//     } catch {
//       // File doesn't exist yet
//     }
//     await Bun.write('/tmp/opencode-knowledge-debug.log', existing + logEntry);
//   } catch {
//     // ignore
//   }
// };

export const knowledgeSearchTool = tool({
  description:
    'Search the knowledge vault for packages matching specific tags. Returns a ranked list of relevant knowledge packages with their metadata.',
  args: {
    tags: tool.schema
      .string()
      .describe(
        "Comma-separated tags to search for (e.g., 'typescript,react,testing'). More specific tags yield better results."
      ),
  },
  async execute(args) {
    const tagArray = args.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    // await logToFile(`knowledge_search called with args.tags="${args.tags}"`);
    // await logToFile(`Parsed tags: ${JSON.stringify(tagArray)}`);

    if (tagArray.length === 0) {
      // await logToFile('knowledge_search - no tags provided');
      return 'No tags provided. Please specify at least one tag.';
    }

    try {
      // await logToFile(`knowledge_search - calling searchKnowledge with ${tagArray.length} tags`);

      const results = await searchKnowledge(tagArray);
      loadCatalog();

      // await logToFile(`searchKnowledge returned ${results.length} results`);
      // await logToFile(`Catalog loaded: yes`);

      if (results.length === 0) {
        return `No knowledge packages found matching [${tagArray.join(', ')}]`;
      }

      let output = `Found ${results.length} packages matching [${tagArray.join(', ')}]:\n\n`;

      for (const result of results.slice(0, 10)) {
        output += `- **${result.path}** (${(result.relevance_score * 100).toFixed(0)}%)\n`;
        output += `  Tags: ${result.matched_tags.join(', ')}\n`;
        output += `  ${result.description}\n\n`;
      }

      if (results.length > 10) {
        output += `\n_...and ${results.length - 10} more results_`;
      }

      return output;
    } catch (error) {
      // await logToFile(`knowledge_search error: ${error}`);
      return 'Failed to search knowledge vault. Please try again.';
    }
  },
});
