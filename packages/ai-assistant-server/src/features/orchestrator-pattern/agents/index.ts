import { Module } from '@nestjs/common';
import { OrchestratorAgent } from './orchestrator.agent';
import { RegistrationWorker } from './registration.agent';
import { FinancialCoachWorker } from './financial-coach.agent';
import { GeneralAssistantWorker } from './general-assistant.agent';
import { ErrorHandlerService } from './error-handler';
import { ToolsModule } from '../tools';
import { OutputSanitizerAgent } from './output-sanitizer.agent';
import { ToneTransformerService } from '../sanitizers/tone-transformer.service';

@Module({
  imports: [ToolsModule],
  providers: [
    OrchestratorAgent,
    RegistrationWorker,
    FinancialCoachWorker,
    GeneralAssistantWorker,
    ErrorHandlerService,
    OutputSanitizerAgent,
    ToneTransformerService,
  ],
  exports: [
    OrchestratorAgent,
    RegistrationWorker,
    FinancialCoachWorker,
    GeneralAssistantWorker,
    ErrorHandlerService,
    OutputSanitizerAgent,
  ],
})
export class AgentsModule {}

export * from './orchestrator.agent';
export * from './registration.agent';
export * from './financial-coach.agent';
export * from './general-assistant.agent';
export * from './error-handler';
export * from './output-sanitizer.agent';
