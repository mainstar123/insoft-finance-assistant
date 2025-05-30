import { Module } from '@nestjs/common';
import { InputSanitizerService } from './input-sanitizer';
import { ToneTransformerService } from './tone-transformer.service';
import { LanguageService } from '../services/language.service';

@Module({
  providers: [InputSanitizerService, ToneTransformerService, LanguageService],
  exports: [InputSanitizerService],
})
export class SanitizersModule {}

export * from './input-sanitizer';
export * from './tone-transformer.service';
