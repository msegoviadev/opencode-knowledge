/**
 * Tool: knowledge_search
 * Search the knowledge vault for packages matching specific tags
 */

import { tool } from '@opencode-ai/plugin';
import { searchKnowledge } from '../knowledge-search.js';
import { loadCatalog } from '../knowledge-catalog.js';
import { createLogger } from '../logger.js';

const log = createLogger('tools.search');

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

    log.debug('knowledge_search called', { tags: args.tags, parsedTags: tagArray });

    if (tagArray.length === 0) {
      log.debug('knowledge_search - no tags provided');
      return 'No tags provided. Please specify at least one tag.';
    }

    try {
      log.debug('knowledge_search - calling searchKnowledge', { tagCount: tagArray.length });

      const results = await searchKnowledge(tagArray);
      loadCatalog();

      log.debug('searchKnowledge completed', { resultsCount: results.length });

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
      log.error('knowledge_search error', { error: String(error) });
      return 'Failed to search knowledge vault. Please try again.';
    }
  },
});
