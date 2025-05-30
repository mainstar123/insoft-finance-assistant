// src/modules/weaviate/weaviate.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WeaviateService } from './weaviate.service';

@Module({
  imports: [ConfigModule],
  providers: [WeaviateService],
  exports: [WeaviateService],
})
export class WeaviateModule {}
