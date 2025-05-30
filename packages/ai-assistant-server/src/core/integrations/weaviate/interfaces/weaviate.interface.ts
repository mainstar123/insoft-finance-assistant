export interface WeaviateSearchOptions {
  limit?: number;
  offset?: number;
  fields?: string[];
  where?: any;
  nearText?: { concepts: string[] };
}

export interface WeaviateSchema {
  class: string;
  description?: string;
  vectorizer?: string;
  moduleConfig?: Record<string, any>;
  properties: Array<{
    name: string;
    description?: string;
    dataType: string[];
    moduleConfig?: Record<string, any>;
    indexInverted?: boolean;
  }>;
}

export interface WeaviateService {
  hasSchema(className: string): Promise<boolean>;
  createSchema(className: string, schema: WeaviateSchema): Promise<void>;
  addObject(className: string, properties: Record<string, any>): Promise<void>;
  searchObjects(
    className: string,
    query: string,
    options?: WeaviateSearchOptions,
  ): Promise<any[]>;
  deleteObjects(className: string, where: any): Promise<void>;
}
