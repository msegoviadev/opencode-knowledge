/**
 * Type definitions for the knowledge system
 */

export interface SessionState {
  role: string;
  isFirstPrompt: boolean;
  loadedPackages: Set<string>;
  createdAt: Date;
}

export interface TemplateVariables {
  [key: string]: string | number | boolean;
}

export interface KnowledgeMapping {
  [category: string]: {
    [tag: string]: {
      [path: string]: any;
    };
  };
}

export interface CategoryTagMap {
  [category: string]: string[];
}