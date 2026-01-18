/**
 * Structured Logger for OpenCode Knowledge Plugin
 *
 * Provides TUI-integrated logging that is silent by default.
 * Logs are only visible when:
 * 1. TUI client is available (logs to app log panel)
 * 2. OPENCODE_KNOWLEDGE_CONSOLE_LOG=1 is set (logs to console)
 */

import type { PluginInput } from '@opencode-ai/plugin';

type PluginClient = PluginInput['client'];
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const ENV_CONSOLE_LOG = 'OPENCODE_KNOWLEDGE_CONSOLE_LOG';

export interface Logger {
  debug(message: string, extra?: Record<string, unknown>): void;
  info(message: string, extra?: Record<string, unknown>): void;
  warn(message: string, extra?: Record<string, unknown>): void;
  error(message: string, extra?: Record<string, unknown>): void;
}

let _client: PluginClient | null = null;

function isConsoleLogEnabled(): boolean {
  const val = process.env[ENV_CONSOLE_LOG];
  return val === '1' || val?.toLowerCase() === 'true';
}

export function initLogger(client: PluginClient): void {
  _client = client;
}

export function getLoggerClient(): PluginClient | null {
  return _client;
}

export function createLogger(module: string): Logger {
  const service = `opencode-knowledge.${module}`;

  const log = (level: LogLevel, message: string, extra?: Record<string, unknown>): void => {
    const app = _client?.app;
    if (app && typeof app.log === 'function') {
      app
        .log({
          body: { service, level, message, extra },
        })
        .catch(() => {
          // Silently ignore logging errors
        });
    } else if (isConsoleLogEnabled()) {
      const prefix = `[${service}]`;
      const args = extra ? [prefix, message, extra] : [prefix, message];
      switch (level) {
        case 'debug':
          console.debug(...args);
          break;
        case 'info':
          console.info(...args);
          break;
        case 'warn':
          console.warn(...args);
          break;
        case 'error':
          console.error(...args);
          break;
      }
    }
  };

  return {
    debug: (message, extra) => log('debug', message, extra),
    info: (message, extra) => log('info', message, extra),
    warn: (message, extra) => log('warn', message, extra),
    error: (message, extra) => log('error', message, extra),
  };
}
