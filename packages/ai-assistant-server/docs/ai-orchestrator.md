# AI Orchestrator

## Overview

The AI Orchestrator is the central coordination system of Tamy Finance Assistant. It manages the flow of information between agents, routes user requests to the appropriate specialized agents, and maintains the conversation state. The orchestrator is built using LangGraph, which provides a flexible framework for defining state transitions and routing logic.

## Key Components

### State Graph

The state graph defines the possible states and transitions in the conversation. It is implemented using LangGraph's `StateGraph` class, which provides a declarative way to define the flow of information through the system.

```typescript
const workflow = new StateGraph<
  AgentStateDefinition,
  AgentStateType,
  StateUpdate | Command,
  AgentType
>(AgentState.spec);
```

The state graph includes:
- Nodes for each agent in the system
- Edges defining the possible transitions between agents
- Conditional edges for dynamic routing based on the conversation state

### Command Routing

The Command routing system enables direct agent-to-agent communication. It allows agents to specify which other agent they want to communicate with and what state updates they want to apply.

```typescript
export type Command = {
  name: AgentType; // The target agent to communicate with
  state: Partial<AgentStateType>; // State updates to apply
};
```

This enables a more flexible architecture where any agent can communicate directly with any other agent, bypassing the traditional sequential flow.

### Context Management

The AI Orchestrator maintains and updates the conversation context throughout the interaction. This includes:

- User information (e.g., phone number)
- Conversation history
- Detected intents
- Financial data (transactions, budgets, goals)
- Processing sequences for multi-agent workflows

## Agent Implementation Patterns

All agents in the system follow a standardized implementation pattern to ensure consistency, maintainability, and robust error handling.

### Standard Agent Structure

Each agent follows this standard structure:

```typescript
@Injectable()
export class SpecializedAgent {
  private readonly llm: ChatOpenAI;
  private readonly logger = new Logger(SpecializedAgent.name);

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0,
    });
  }

  createNode(): RunnableLike<typeof AgentState.State, AgentResult> {
    // Define tools
    const tools = [
      // Tool definitions using DynamicStructuredTool
    ];

    // Define system message
    const systemMessage = new SystemMessage(`You are a specialized agent for...`);

    // Create the agent
    const agent = createReactAgent({
      llm: this.llm,
      tools,
      systemMessage,
    });

    // Return the node function
    return async (state: typeof AgentState.State) => {
      try {
        this.logger.log('Processing state in SpecializedAgent');

        // Process the state
        const result = await agent.invoke({
          messages: state.messages,
          // Additional context
        });

        // Update state based on result
        return {
          messages: result.messages || [],
          next: AGENT_NODES.NEXT_AGENT,
          // Additional state updates
        };
      } catch (error) {
        this.logger.error('Error in SpecializedAgent:', error);
        return {
          messages: [
            ...state.messages,
            new AIMessage('I encountered an error processing your request. Please try again.'),
          ],
          next: AGENT_ACTIONS.FINISH,
        };
      }
    };
  }
}
```

### Tool-Based Implementation

Agents use the `DynamicStructuredTool` class to define their capabilities, with Zod schemas for type validation:

```typescript
const createBudgetTool = new DynamicStructuredTool({
  name: 'createBudget',
  description: 'Create a new budget for a specific category',
  schema: z.object({
    category: z.string().describe('The budget category'),
    limit: z.number().describe('The budget limit amount'),
    period: z.enum(['daily', 'weekly', 'monthly']).describe('The budget period'),
  }),
  func: async ({ category, limit, period }) => {
    this.logger.log(`Creating budget: ${category}, ${limit}, ${period}`);
    // Implementation
    return { success: true, message: `Budget created for ${category}` };
  },
});
```

### Error Handling

All agents implement robust error handling to ensure the system can recover from failures:

```typescript
try {
  // Agent processing logic
} catch (error) {
  this.logger.error(`Error in ${this.constructor.name}:`, error);

  // Determine error type and provide appropriate message
  let errorMessage = 'I encountered an error processing your request.';
  if (error instanceof ValidationError) {
    errorMessage = 'I couldn\'t understand some details in your request.';
  } else if (error instanceof ExternalServiceError) {
    errorMessage = 'I\'m having trouble connecting to an external service.';
  }

  return {
    messages: [
      ...state.messages,
      new AIMessage(errorMessage),
    ],
    next: AGENT_ACTIONS.FINISH,
  };
}
```

### Progress Tracking

Agents implement progress tracking through detailed logging at key execution points:

```typescript
createNode(): RunnableLike<typeof AgentState.State, AgentResult> {
  return async (state: typeof AgentState.State) => {
    try {
      this.logger.log('Starting processing in SpecializedAgent');

      // Process the state
      this.logger.log('Invoking LLM with user query');
      const result = await agent.invoke({
        messages: state.messages,
      });

      this.logger.log('LLM processing complete, analyzing result');
      // Process result

      this.logger.log('Updating state with processed result');
      // Update state

      this.logger.log('SpecializedAgent processing complete');
      return {
        // State updates
      };
    } catch (error) {
      // Error handling
    }
  };
}
```

## Flow Control

### Initial Routing

When a user sends a message, the AI Orchestrator first routes it to the Supervisor Agent, which analyzes the message and detects the user's intents. Based on these intents, the orchestrator routes the message to the appropriate team supervisor or specialized agent.

```typescript
workflow.addConditionalEdges(
  AGENT_NODES.INITIAL,
  (state: AgentStateType) => {
    const { intents } = state.context;

    // Route based on detected intents
    if (intents?.length) {
      return intents.map((intent: string) => {
        // Routing logic...
      });
    }

    return AGENT_ACTIONS.FINISH;
  }
);
```

### Team-Based Routing

The orchestrator routes requests to team supervisors rather than individual agents when possible. This allows for better coordination and specialization within teams.

```typescript
// Route to team supervisor instead of individual agent when possible
if (intentNode === AGENT_NODES.BUDGET || intentNode === AGENT_NODES.GOALS) {
  return AGENT_TEAMS.FINANCIAL_PLANNING.SUPERVISOR;
} else if (intentNode === AGENT_NODES.TRANSACTION || intentNode === AGENT_NODES.INSIGHTS) {
  return AGENT_TEAMS.FINANCIAL_TRACKING.SUPERVISOR;
} else if (intentNode === AGENT_NODES.GRAPH_RAG) {
  return AGENT_TEAMS.KNOWLEDGE.SUPERVISOR;
} else {
  return intentNode;
}
```

### Sequential Processing

The orchestrator supports sequential processing of requests through multiple agents. This is implemented using a processing sequence in the conversation context.

```typescript
if (state.context.processingSequence && state.context.processingSequence.length > 0) {
  // Get the next agent in the sequence
  const nextAgent = state.context.processingSequence[0];

  // Update the context to remove the processed agent from the sequence
  state.context.processingSequence = state.context.processingSequence.slice(1);

  return nextAgent;
}
```

### Conversation End Routing

The orchestrator now properly handles the end of conversations through explicit END routing for all team supervisors. This ensures that conversations can be gracefully terminated when they're complete.

Each team supervisor (Planning, Tracking, Management) has END included in their conditional edges:

```typescript
workflow.addConditionalEdges(
  AGENT_TEAMS.FINANCIAL_PLANNING.SUPERVISOR,
  (state: AgentStateType) => {
    // Existing routing logic...

    // Added END routing for conversation completion
    if (state.next === END) {
      return END;
    }

    // Other routing logic...
  }
);
```

The system prompts for team supervisors explicitly mention END as an option, making it clear to the LLM when it should route to END:

```typescript
const systemPrompt = `
  You are a Financial Planning Team Supervisor...

  Based on the user's request, route to the appropriate agent:
  - For budget-related queries → ${AGENT_NODES.BUDGET}
  - For financial goal setting → ${AGENT_NODES.GOALS}
  - When the conversation is complete and no further action is needed → ${END}
`;
```

This implementation ensures that conversations are properly terminated when they're complete, preventing routing errors and improving the user experience.

## Message Processing

The `processMessage` method is the entry point for user messages. It creates an initial state update with the user's message and phone number, then invokes the state graph to process the message.

```typescript
async processMessage(userPhone: string, message: string): Promise<void> {
  try {
    const stateUpdate: StateUpdate = {
      messages: [new HumanMessage(message)],
      userPhone,
      context: {},
      next: AGENT_NODES.SUPERVISOR,
    };

    const result = await this.graph.invoke(stateUpdate);
  } catch (error) {
    this.logger.error('Error in agent processing:', error);
  }
}
```

## Authentication and Authorization

The AI Orchestrator includes a TODO for implementing user authentication and authorization:

```typescript
// TODO - Matheus:
// - Criar um agente para verificar se o usuario esta registrado ou nao
// - Se o usuario nao esta registrado, o usuario so deve ter acesso ao agente de suporte
// - para usar os outros agentes, o usuario precisa estar registrado, sempre que o usuario tentar usar um agente
// para usuarios registrados, informar que aquela funcionalidade é restrita a usuarios registrados e enviar o flow de registro
```

This will ensure that only registered users can access certain features of the system, while unregistered users are directed to the support agent and registration flow.

## Recent Improvements

The AI Orchestrator and agent system have undergone significant standardization improvements:

1. **Consistent Agent Implementation**: All agents now follow a standardized implementation pattern with a consistent structure, error handling, and progress tracking.

2. **Enhanced Type Safety**: Proper interfaces and type definitions have been added for all data structures used by agents.

3. **Tool-Based Approach**: Agents now use a tool-based approach with `DynamicStructuredTool` and Zod schemas for better type validation and clearer functionality.

4. **Improved Error Handling**: Comprehensive error handling has been implemented across all agents to provide better error messages and recovery mechanisms.

5. **Progress Tracking**: Detailed logging has been added at key execution points to improve visibility into the system's operation.

6. **Model Upgrades**: Agents have been upgraded to use GPT-4 for improved performance and capabilities.

These improvements have significantly enhanced the robustness, maintainability, and user experience of the system.
