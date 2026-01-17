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

// Simple logging
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

export const opencodeKnowledge: Plugin = async () => {
  // await logToFile('Plugin initialized');

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
          // await logToFile(`🎯 First message in session ${input.sessionID}`);

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

            // await logToFile('✅ Knowledge map injected');
          }

          updateSessionState(input.sessionID, {
            isFirstPrompt: false,
            categoriesShown: vaultExists,
          });

          // await logToFile('✅ First message processed');
        }
      } catch (error) {
        // await logToFile(`❌ Error in chat.message: ${error}`);
      }
    },

    event: async ({ event }) => {
      try {
        if (event.type === 'session.created') {
          // await logToFile('🚀 session.created event');

          const eventData = event as any;
          const sessionId = eventData.properties?.info?.id;

          if (!sessionId) {
            const errorMsg = `❌ Could not extract session ID from session.created event`;
            // await logToFile(errorMsg);
            throw new Error(errorMsg);
          }

          // await logToFile(`✅ Extracted session ID: ${sessionId}`);

          // Clear session tracking files
          clearJsonl('session-state.jsonl');
          clearJsonl('knowledge-reads.jsonl');

          // Auto-build knowledge catalog on session start
          if (existsSync('.opencode/knowledge/vault')) {
            // await logToFile('📚 Building knowledge index...');
            try {
              const catalog = buildKnowledgeCatalog();
              saveCatalog(catalog);
              const packagesCount = Object.values(catalog.knowledge).reduce(
                (sum, packages) => sum + Object.keys(packages).length,
                0
              );
              // await logToFile(`✅ Knowledge catalog built: ${packagesCount} packages`);
            } catch (error) {
              // await logToFile(`⚠️  Failed to build knowledge catalog: ${error}`);
              // Don't fail session start if build fails
            }
          }

          await createSessionState(sessionId);
          // await logToFile(`✅ Session state created`);
        }
      } catch (error) {
        // await logToFile(`❌ Error in event: ${error}`);
      }
    },
  };
};
