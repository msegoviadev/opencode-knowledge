/**
 * OpenCode Knowledge Plugin
 */

import type { Plugin } from '@opencode-ai/plugin';
import { existsSync } from 'fs';
import { createSessionState, getSessionState, updateSessionState } from './lib/session-state.js';
import { loadAndRenderTemplate, getCorePackages } from './lib/template-renderer.js';
import { buildCategoryTagMap, formatCategoryTagMap } from './lib/knowledge-search.js';
import { buildKnowledgeCatalog, saveCatalog } from './lib/knowledge-catalog.js';
import { clearJsonl } from './lib/file-utils.js';
import { knowledgeSearchTool } from './lib/tools/search.js';
import { knowledgeLoadTool } from './lib/tools/load.js';
import { knowledgeIndexTool } from './lib/tools/index.js';
import { initLogger, createLogger } from './lib/logger.js';

const log = createLogger('plugin');

export const opencodeKnowledge: Plugin = async (input) => {
  initLogger(input.client);
  log.info('Plugin initialized');

  return {
    tool: {
      knowledge_search: knowledgeSearchTool,
      knowledge_load: knowledgeLoadTool,
      knowledge_index: knowledgeIndexTool,
    },

    'chat.message': async (input, output) => {
      try {
        const state = getSessionState(input.sessionID);

        // First message: inject full knowledge map
        if (state.isFirstPrompt) {
          log.debug('First message in session', { sessionID: input.sessionID });

          // Check if vault exists
          const vaultExists = existsSync('.opencode/knowledge/vault');

          if (vaultExists) {
            // Show full knowledge map
            const categoryTagMap = buildCategoryTagMap();
            const formattedMap = formatCategoryTagMap(categoryTagMap);
            const categoriesCount = Object.keys(categoryTagMap).length;
            const coreKnowledge = getCorePackages();

            const knowledgePrompt = await loadAndRenderTemplate('first-prompt.template.md', {
              CATEGORIES_COUNT: categoriesCount,
              FORMATTED_MAP: formattedMap,
              CORE_TAGS: coreKnowledge.tags.join(','),
              CORE_PACKAGES_LIST: '- ' + coreKnowledge.packages.join('\n- '),
            });

            output.parts.push({
              type: 'text',
              text: knowledgePrompt,
              id: `knowledge-${Date.now()}`,
              sessionID: input.sessionID,
              messageID: input.messageID || '',
            } as any);

            log.debug('Knowledge map injected');
          }

          updateSessionState(input.sessionID, {
            isFirstPrompt: false,
            categoriesShown: vaultExists,
          });

          log.debug('First message processed');
        }
      } catch (error) {
        log.error('Error in chat.message', { error: String(error) });
      }
    },

    event: async ({ event }) => {
      try {
        if (event.type === 'session.created') {
          log.debug('session.created event');

          const eventData = event as any;
          const sessionId = eventData.properties?.info?.id;

          if (!sessionId) {
            const errorMsg = 'Could not extract session ID from session.created event';
            log.error(errorMsg);
            throw new Error(errorMsg);
          }

          log.debug('Extracted session ID', { sessionId });

          // Clear session tracking files
          clearJsonl('session-state.jsonl');
          clearJsonl('knowledge-reads.jsonl');

          // Auto-build knowledge catalog on session start
          if (existsSync('.opencode/knowledge/vault')) {
            log.debug('Building knowledge index...');
            try {
              const catalog = buildKnowledgeCatalog();
              saveCatalog(catalog);
              const packagesCount = Object.values(catalog.knowledge).reduce(
                (sum, packages) => sum + Object.keys(packages).length,
                0
              );
              log.info('Knowledge catalog built', { packagesCount });
            } catch (error) {
              log.warn('Failed to build knowledge catalog', { error: String(error) });
              // Don't fail session start if build fails
            }
          }

          await createSessionState(sessionId);
          log.debug('Session state created');
        }
      } catch (error) {
        log.error('Error in event', { error: String(error) });
      }
    },
  };
};
