import { StateGraph } from '@langchain/langgraph';
import { OrchestratorState, orchestratorStateChannels } from '../types';
import { Injectable } from '@nestjs/common';
import { OutputSanitizerAgent } from '../agents/output-sanitizer.agent';

@Injectable()
export class GraphConfigService {
  constructor(private readonly outputSanitizer: OutputSanitizerAgent) {}

  configureGraph(): StateGraph<OrchestratorState> {
    const graph = new StateGraph({
      channels: orchestratorStateChannels,
    });

    // Add nodes
    graph.addNode('output_sanitizer', async (state) => {
      return this.outputSanitizer.processOutput(state);
    });

    // ... rest of the graph configuration ...

    return graph;
  }
}
