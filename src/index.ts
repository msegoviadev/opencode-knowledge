/**
 * OpenCode Knowledge Plugin
 */

import type { Plugin } from '@opencode-ai/plugin';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { createSessionState, getSessionState, updateSessionState } from './lib/session-state.js';

// Simple logging
const logToFile = async (message: string) => {
  try {
    const logEntry = `${new Date().toISOString()}: ${message}\n`;
    let existing = '';
    try {
      existing = await Bun.file('/tmp/opencode-knowledge-debug.log').text();
    } catch {
      // File doesn't exist yet
    }
    await Bun.write('/tmp/opencode-knowledge-debug.log', existing + logEntry);
  } catch (e) {
    // ignore
  }
};

// Command loader
interface CommandFrontmatter {
  description?: string;
  agent?: string;
  model?: string;
  subtask?: boolean;
}

interface ParsedCommand {
  name: string;
  frontmatter: CommandFrontmatter;
  template: string;
}

function parseFrontmatter(content: string): { frontmatter: CommandFrontmatter; body: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, body: content.trim() };
  }

  const [, yamlContent, body] = match;
  const frontmatter: CommandFrontmatter = {};

  for (const line of yamlContent.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    if (key === 'description') frontmatter.description = value;
    if (key === 'agent') frontmatter.agent = value;
    if (key === 'model') frontmatter.model = value;
    if (key === 'subtask') frontmatter.subtask = value === 'true';
  }

  return { frontmatter, body: body.trim() };
}

async function loadCommands(): Promise<ParsedCommand[]> {
  const commands: ParsedCommand[] = [];
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  const commandDir = path.join(__dirname, 'command');

  if (!existsSync(commandDir)) {
    return commands;
  }

  const glob = new Bun.Glob('**/*.md');

  for await (const file of glob.scan({ cwd: commandDir, absolute: true })) {
    const content = await Bun.file(file).text();
    const { frontmatter, body } = parseFrontmatter(content);

    const relativePath = path.relative(commandDir, file);
    const name = relativePath.replace(/\.md$/, '').replace(/\//g, '-');

    commands.push({
      name,
      frontmatter,
      template: body,
    });
  }

  return commands;
}

// Load personality from user settings
async function loadPersonality(): Promise<string> {
  const settingsPath = '.opencode/knowledge/settings.json';

  // Settings file must exist
  if (!existsSync(settingsPath)) {
    const errorMsg = `❌ CONFIGURATION ERROR: Settings file not found at ${settingsPath}. Please create this file with {"role": "your_role"}`;
    await logToFile(errorMsg);
    throw new Error(errorMsg);
  }

  // Parse settings
  let role: string;
  try {
    const settingsContent = await readFile(settingsPath, 'utf-8');
    const settings = JSON.parse(settingsContent);

    if (!settings.role) {
      const errorMsg = `❌ CONFIGURATION ERROR: Settings file exists but missing 'role' field. Please add {"role": "your_role"} to ${settingsPath}`;
      await logToFile(errorMsg);
      throw new Error(errorMsg);
    }

    role = settings.role;
    await logToFile(`✅ Settings loaded: role="${role}" from ${settingsPath}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('CONFIGURATION ERROR')) {
      throw error;
    }
    const errorMsg = `❌ Error parsing settings.json: ${error}`;
    await logToFile(errorMsg);
    throw new Error(errorMsg);
  }

  // Calculate __dirname at runtime to avoid build-time path baking
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  // Load personality file - try both possible locations
  let personalityPath = path.join(__dirname, '..', 'templates', 'personalities', `${role}.txt`);

  if (!existsSync(personalityPath)) {
    // Fallback for bundled dist structure (templates inside dist/)
    personalityPath = path.join(__dirname, 'templates', 'personalities', `${role}.txt`);
  }

  if (!existsSync(personalityPath)) {
    const errorMsg = `❌ CONFIGURATION ERROR: Personality file not found at ${personalityPath}. Available roles should have a corresponding .txt file in templates/personalities/`;
    await logToFile(errorMsg);
    throw new Error(errorMsg);
  }

  const content = await readFile(personalityPath, 'utf-8');
  await logToFile(`✅ Personality loaded from: ${personalityPath}`);
  return content.trim();
}

export const opencodeKnowledge: Plugin = async (ctx) => {
  await logToFile('Plugin initialized');

  const commands = await loadCommands();

  return {
    async config(config) {
      config.command = config.command ?? {};

      for (const cmd of commands) {
        let template = cmd.template;
        template = template.replace('{{CURRENT_TIME}}', new Date().toISOString());

        config.command[cmd.name] = {
          template: template,
          description: cmd.frontmatter.description,
          agent: cmd.frontmatter.agent,
          model: cmd.frontmatter.model,
          subtask: cmd.frontmatter.subtask,
        };
      }
    },

    // Hook for modifying chat messages - THIS IS THE RIGHT HOOK!
    'chat.message': async (input, output) => {
      try {
        const state = getSessionState(input.sessionID);

        // Only inject personality on the first message of the session
        if (state.isFirstPrompt) {
          await logToFile(`🎯 First message in session ${input.sessionID} - injecting personality`);

          const personality = await loadPersonality();

          // Inject personality into message parts with all required fields
          const personalityPart = {
            type: 'text',
            text: `## Role Context\n\n${personality}`,
            id: `personality-${Date.now()}`,
            sessionID: input.sessionID,
            messageID: input.messageID || '',
          };

          output.parts.push(personalityPart as any);

          // Mark that we've shown the personality
          updateSessionState(input.sessionID, { isFirstPrompt: false });

          await logToFile('✅ Personality injected on first message!');
        } else {
          await logToFile(`⏭️  Subsequent message - skipping personality injection`);
        }
      } catch (error) {
        await logToFile(`❌ Error in chat.message: ${error}`);
      }
    },

    // Event handler for session lifecycle
    event: async ({ event }) => {
      try {
        if (event.type === 'session.created') {
          await logToFile('🚀 session.created event');

          // Extract session ID from event properties
          const eventData = event as any;
          const sessionId = eventData.properties?.info?.id;

          if (!sessionId) {
            const errorMsg = `❌ Could not extract session ID from session.created event`;
            await logToFile(errorMsg);
            await logToFile(`Event structure: ${JSON.stringify(eventData)}`);
            throw new Error(errorMsg);
          }

          await logToFile(`✅ Extracted session ID: ${sessionId}`);

          await createSessionState(sessionId);
          const state = getSessionState(sessionId);
          await logToFile(
            `✅ Session state created for session ${sessionId} with role: ${state.role}`
          );
        }
      } catch (error) {
        await logToFile(`❌ Error in event: ${error}`);
      }
    },
  };
};
