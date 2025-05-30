import { Injectable, Logger } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage } from '@langchain/core/messages';

// Definition for language detection response
const LanguageDetectionSchema = z.object({
  languageCode: z
    .string()
    .describe('ISO language code (e.g., "en", "pt", "es", "fr")'),
  languageName: z
    .string()
    .describe('Full language name (e.g., "English", "Portuguese", "Spanish")'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence score between 0 and 1'),
});

@Injectable()
export class LanguageService {
  private readonly logger = new Logger(LanguageService.name);
  private readonly languageCache = new Map<string, string>();
  private readonly detectionModel;

  constructor() {
    // Use a lightweight model for language detection
    const model = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0.1,
      cache: true,
    });

    // Create a prebuilt agent for language detection
    this.detectionModel = createReactAgent({
      llm: model,
      tools: [],
      responseFormat: {
        schema: LanguageDetectionSchema,
        prompt:
          'Analyze the message and determine the language. Return only the language code, name, and confidence level.',
      },
    });
  }

  /**
   * Detects the language of a message
   * @param message The message to analyze
   * @returns Information about the detected language
   */
  async detectLanguage(message: string): Promise<{
    languageCode: string;
    languageName: string;
    confidence: number;
  }> {
    if (!message || message.trim().length === 0) {
      return { languageCode: 'en', languageName: 'English', confidence: 1.0 };
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(message);
    if (this.languageCache.has(cacheKey)) {
      const cachedLanguage = this.languageCache.get(cacheKey);
      this.logger.debug(`Using cached language detection: ${cachedLanguage}`);
      return {
        languageCode: cachedLanguage || 'en',
        languageName: this.getLanguageName(cachedLanguage || 'en'),
        confidence: 1.0,
      };
    }

    try {
      // Use the detection model to analyze the language
      const result = await this.detectionModel.invoke({
        messages: [new HumanMessage(message)],
      });

      const detection = result.structuredResponse;

      // Cache the result
      this.languageCache.set(cacheKey, detection.languageCode);

      return detection;
    } catch (error) {
      this.logger.warn('Error detecting language', error);
      // Default to English on failure
      return { languageCode: 'en', languageName: 'English', confidence: 0.5 };
    }
  }

  /**
   * Gets language name from ISO code
   */
  getLanguageName(languageCode: string): string {
    const languageMap = {
      en: 'English',
      pt: 'Portuguese',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      ja: 'Japanese',
      zh: 'Chinese',
      ru: 'Russian',
      ar: 'Arabic',
      nl: 'Dutch',
      pl: 'Polish',
      ro: 'Romanian',
      sv: 'Swedish',
      tr: 'Turkish',
      vi: 'Vietnamese',
      hu: 'Hungarian',
    };

    return languageMap[languageCode as keyof typeof languageMap] || 'Unknown';
  }

  /**
   * Generates a consistent cache key for a message
   */
  private generateCacheKey(message: string): string {
    // Use first 100 chars for caching to avoid memory issues
    return message.trim().toLowerCase().substring(0, 100);
  }
}
