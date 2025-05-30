import { WeaviateModule } from '@/core/integrations/weaviate/weaviate.module';
import { MemoryManagerService } from './memory-manager.service';
import { Module } from '@nestjs/common';
import { TamyMemoryService } from './tamy-memory-saver';

@Module({
  imports: [WeaviateModule],
  providers: [MemoryManagerService, TamyMemoryService],
  exports: [MemoryManagerService, TamyMemoryService],
})
export class MemoryModule {}

export * from './memory-manager.service';
export * from './tamy-memory-saver';
