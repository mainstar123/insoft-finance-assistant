import { Injectable, Logger } from '@nestjs/common';

import { RedisService } from '@/core/integrations/redis/redis.service';
import OpenAI from 'openai';

interface CountryInfo {
  locale: string;
  currency: string;
}

@Injectable()
export class CountryInfoService {
  private readonly logger = new Logger(CountryInfoService.name);
  private readonly CACHE_TTL = 60 * 60 * 24 * 7; // 7 days in seconds
  private readonly openai = new OpenAI();

  constructor(
    private readonly redisService: RedisService,
  ) {}

  async getCountryInfo(country: string): Promise<CountryInfo> {
    try {
      // Try to get from cache first
      const cacheKey = `country_info:${country.toLowerCase()}`;
      const cachedInfo = await this.redisService.get(cacheKey);

      if (cachedInfo) {
        return JSON.parse(cachedInfo);
      }

      // If not in cache, use LLM to get the information
      const prompt = `Given the country "${country}", provide the most common locale and currency code in a structured format.
      Requirements:
      - Locale should be in format: language_COUNTRY (e.g., en_US, pt_BR)
      - Currency should be the 3-letter ISO code (e.g., USD, BRL)
      - Language code should be lowercase, country code uppercase
      - Must be the most widely used locale and currency in the country

      Respond in JSON format only:
      {
        "locale": "string",
        "currency": "string"
      }`;

      const response =
        await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        });

      // Cache the result
      await this.redisService.set(
        cacheKey,
        JSON.stringify(response),
        this.CACHE_TTL,
      );

      return JSON.parse(response.choices[0]?.message.content || '{}');
    } catch (error) {
      this.logger.error(`Error getting country info for ${country}:`, error);
      // Return default values if something goes wrong
      return {
        locale: 'en_US',
        currency: 'USD',
      };
    }
  }
}
