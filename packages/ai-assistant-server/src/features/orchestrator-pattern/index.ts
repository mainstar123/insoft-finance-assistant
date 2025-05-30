import { UserModule } from '@/features/user/user.module';
import { Module } from '@nestjs/common';
import { AgentsModule } from './agents';
import { WorkflowService } from './graph/workflow';
import { MemoryModule } from './memory';
import { OrchestratorChannelService } from './orchestrator-channel.service';
import { SanitizersModule } from './sanitizers';
import { ThreadModule } from './thread/thread.module';

@Module({
  imports: [AgentsModule, SanitizersModule, MemoryModule, UserModule, ThreadModule],
  providers: [
    WorkflowService,
    OrchestratorChannelService,
  ],
  exports: [WorkflowService, OrchestratorChannelService],
})
export class OrchestratorPatternModule {}
