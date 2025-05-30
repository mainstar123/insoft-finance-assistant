export interface FinancialMemoryData {
  userId: string;
  threadId?: string;
  type: 'transaction' | 'preference' | 'conversation' | 'action';
  content: string;
  category?: string;
  amount?: number;
  confidence?: number;
  source?: string;
  timestamp: Date;
}

export const FINANCIAL_MEMORY_CLASS_NAME = 'FinancialMemory';

export const FINANCIAL_MEMORY_SCHEMA = {
  class: FINANCIAL_MEMORY_CLASS_NAME,
  description: 'Long-term financial memory for registered users',
  vectorizer: 'text2vec-openai',
  moduleConfig: {
    'text2vec-openai': {
      model: 'text-embedding-3-small',
      modelVersion: '3',
      type: 'text',
    },
  },
  properties: [
    {
      name: 'userId',
      description: 'The unique identifier of the user',
      dataType: ['string'],
      moduleConfig: {
        'text2vec-openai': { skip: true },
      },
    },
    {
      name: 'threadId',
      description: 'The conversation thread ID',
      dataType: ['string'],
      moduleConfig: {
        'text2vec-openai': { skip: true },
      },
    },
    {
      name: 'type',
      description: 'The type of memory',
      dataType: ['string'],
      moduleConfig: {
        'text2vec-openai': { skip: true },
      },
    },
    {
      name: 'content',
      description: 'The actual content of the memory',
      dataType: ['text'],
    },
    {
      name: 'category',
      description: 'Optional category for the memory',
      dataType: ['string'],
      moduleConfig: {
        'text2vec-openai': { skip: true },
      },
    },
    {
      name: 'amount',
      description: 'Optional amount for financial transactions',
      dataType: ['number'],
      moduleConfig: {
        'text2vec-openai': { skip: true },
      },
    },
    {
      name: 'confidence',
      description: 'Optional confidence score',
      dataType: ['number'],
      moduleConfig: {
        'text2vec-openai': { skip: true },
      },
    },
    {
      name: 'source',
      description: 'Optional source of the memory',
      dataType: ['string'],
      moduleConfig: {
        'text2vec-openai': { skip: true },
      },
    },
    {
      name: 'timestamp',
      description: 'When the memory was created',
      dataType: ['date'],
      moduleConfig: {
        'text2vec-openai': { skip: true },
      },
    },
  ],
};
