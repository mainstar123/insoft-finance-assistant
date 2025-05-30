import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get<T>(key: string): T {
    const value = this.configService.get<T>(key);
    if (!value) {
      throw new Error(`Configuration key ${key} is not set.`);
    }
    return value;
  }

  getWeaviateUrl(): string {
    return this.get<string>('WEAVIATE_URL');
  }

  getOpenAIKey(): string {
    return this.get<string>('OPENAI_API_KEY');
  }
}
