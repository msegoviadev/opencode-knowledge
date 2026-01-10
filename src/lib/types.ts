/**
 * Type definitions for the knowledge system
 */

export interface SessionState {
  role: string;
  isFirstPrompt: boolean;
  loadedPackages: Set<string>;
  createdAt: Date;
  categoriesShown?: boolean;
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

export interface KnowledgeFrontmatter {
  tags: string[];
  description: string;
  category: string;
  required_knowledge?: string[];
  file_patterns?: string[];
}

export interface KnowledgeCatalog {
  knowledge: Record<string, Record<string, KnowledgePackage>>;
  built_at: string;
}

export interface KnowledgePackage {
  tags: string[];
  description: string;
  category: string;
  path: string;
  required_knowledge?: string[];
}

export interface SearchResult {
  path: string;
  relevance_score: number;
  matched_tags: string[];
  description: string;
}
