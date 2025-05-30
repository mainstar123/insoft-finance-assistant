# Agent Standardization Guide

## Overview

This document outlines the standardization patterns implemented across all agents in the Tamy Finance Assistant. These patterns ensure consistency, maintainability, and robust error handling throughout the multi-agent system.

## Current Implementation Status

While the standardization patterns described in this document represent the target architecture, the current implementation shows some variations in how agents are structured. These variations include:

1. **Tool Implementation**: Some agents use the tool-based approach with `DynamicStructuredTool` and Zod schemas, while others use custom implementations.

2. **Error Handling**: The level of error handling varies across agents, with some implementing comprehensive error handling and others using more basic approaches.

3. **Progress Tracking**: The implementation of progress tracking through logging varies in detail and consistency across agents.

4. **Model Usage**: While most agents use GPT-4o-mini as specified in the base agent, some specialized agents may use different models for specific tasks.

These variations are being addressed through ongoing refactoring efforts to bring all agents in line with the standardization patterns described in this document.

## Key Standardization Patterns

### 1. Consistent Agent Structure

All agents follow a consistent class structure:

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
      // Tool definitions
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
        // Process the state
        const result = await agent.invoke({
          messages: state.messages,
          // Additional context
        });

        // Return state update
        return {
          messages: result.messages || [],
          next: AGENT_NODES.NEXT_AGENT,
        };
      } catch (error) {
        // Error handling
      }
    };
  }
}
```

### 2. Tool-Based Implementation

Agents use `DynamicStructuredTool` with Zod schemas to define their capabilities:

```typescript
const tools = [
  new DynamicStructuredTool({
    name: 'toolName',
    description: 'Tool description',
    schema: z.object({
      param1: z.string().describe('Parameter description'),
      param2: z.number().describe('Parameter description'),
    }),
    func: async ({ param1, param2 }) => {
      // Tool implementation
      return { success: true, result: 'Operation completed' };
    },
  }),
];
```

This approach provides several benefits:
- **Type Safety**: Zod schemas ensure proper type validation
- **Self-Documentation**: Schema descriptions provide clear documentation
- **Consistent Interface**: All tools follow the same pattern
- **Error Handling**: Schema validation catches invalid inputs early

### 3. Enhanced Type Safety

Proper interfaces are defined for all data structures:

```typescript
interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  isIncome?: boolean;
}

interface AgentToolResult {
  success: boolean;
  message?: string;
  transaction?: Transaction;
  // Other possible return values
}
```

### 4. Comprehensive Error Handling

All agents implement robust error handling:

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

### 5. Progress Tracking

Agents implement detailed logging at key execution points:

```typescript
this.logger.log('Starting processing in SpecializedAgent');
this.logger.log('Invoking LLM with user query');
// Processing steps
this.logger.log('LLM processing complete, analyzing result');
this.logger.log('Updating state with processed result');
this.logger.log('SpecializedAgent processing complete');
```

## Implementation Examples

### Transaction Agent Example

```typescript
@Injectable()
export class TransactionAgent {
  private readonly llm: ChatOpenAI;
  private readonly logger = new Logger(TransactionAgent.name);

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0,
    });
  }

  createNode(): RunnableLike<typeof AgentState.State, AgentResult> {
    // Define tools
    const tools = [
      new DynamicStructuredTool({
        name: 'recordTransaction',
        description: 'Record a new financial transaction',
        schema: z.object({
          amount: z.number().describe('The transaction amount'),
          category: z.string().describe('The transaction category'),
          description: z.string().describe('The transaction description'),
          date: z.string().optional().describe('The transaction date (YYYY-MM-DD)'),
          isIncome: z.boolean().optional().describe('Whether this is an income transaction'),
        }),
        func: async ({ amount, category, description, date, isIncome }) => {
          this.logger.log(`Recording transaction: ${amount} in ${category} for ${description}`);

          // Create transaction object
          const transaction: Transaction = {
            id: uuidv4(),
            amount,
            category,
            description,
            date: date || new Date().toISOString().split('T')[0],
            isIncome: isIncome || false,
          };

          this.logger.log(`Transaction recorded with ID: ${transaction.id}`);
          return {
            success: true,
            transaction,
            message: `Transaction of ${amount} for ${description} recorded successfully.`
          };
        },
      }),
    ];

    // Define system message
    const systemMessage = new SystemMessage(`You are a financial transaction specialist.
Your role is to help users record and categorize their financial transactions.
Extract transaction details from user messages and use the recordTransaction tool to save them.
Be helpful and confirm the details before recording.`);

    // Create the agent
    const agent = createReactAgent({
      llm: this.llm,
      tools,
      systemMessage,
    });

    // Return the node function
    return async (state: typeof AgentState.State) => {
      try {
        this.logger.log('Starting transaction processing');

        // Process the state
        this.logger.log('Invoking transaction agent with user message');
        const result = await agent.invoke({
          messages: state.messages,
        });

        this.logger.log('Transaction agent processing complete, analyzing result');

        // Check for tool calls
        const toolCalls = result.messages
          .filter(message => message.additional_kwargs?.tool_calls)
          .flatMap(message => message.additional_kwargs.tool_calls);

        if (toolCalls?.length > 0) {
          this.logger.log(`Found ${toolCalls.length} tool calls in result`);

          // Process tool calls
          for (const call of toolCalls) {
            if (call.function.name === 'recordTransaction') {
              try {
                const args = JSON.parse(call.function.arguments);
                const transaction: Transaction = {
                  id: uuidv4(),
                  amount: args.amount,
                  category: args.category,
                  description: args.description,
                  date: args.date || new Date().toISOString().split('T')[0],
                  isIncome: args.isIncome || false,
                };

                // Update state with new transaction
                state.transactions = [...(state.transactions || []), transaction];

                this.logger.log(`Added transaction to state: ${transaction.id}`);

                // Notify budget agent if needed
                if (!transaction.isIncome) {
                  this.logger.log(`Notifying budget agent about expense in ${transaction.category}`);
                  return {
                    command: new Command({
                      name: AGENT_NODES.BUDGET,
                      state: {
                        budget: {
                          spent: { [transaction.category]: transaction.amount },
                        },
                        messages: result.messages || [],
                        context: {
                          transaction,
                        },
                      },
                    }),
                  };
                }
              } catch (parseError) {
                this.logger.error('Error parsing transaction arguments:', parseError);
              }
            }
          }
        }

        this.logger.log('Transaction processing complete');
        return {
          messages: result.messages || [],
          transactions: state.transactions,
          next: AGENT_NODES.MESSAGE_FORMATTER,
        };
      } catch (error) {
        this.logger.error('Error in TransactionAgent:', error);
        return {
          messages: [
            ...state.messages,
            new AIMessage('I encountered an error processing your transaction. Please try again with clearer details.'),
          ],
          next: AGENT_ACTIONS.FINISH,
        };
      }
    };
  }
}
```

### Goals Agent Example

```typescript
@Injectable()
export class GoalsAgent {
  private readonly llm: ChatOpenAI;
  private readonly logger = new Logger(GoalsAgent.name);

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0,
    });
  }

  createNode(): RunnableLike<typeof AgentState.State, AgentResult> {
    // Define tools
    const tools = [
      new DynamicStructuredTool({
        name: 'setGoal',
        description: 'Set a new financial goal',
        schema: z.object({
          name: z.string().describe('The name of the goal'),
          targetAmount: z.number().describe('The target amount for the goal'),
          deadline: z.string().describe('The deadline for the goal (YYYY-MM-DD)'),
          category: z.string().optional().describe('The category of the goal'),
        }),
        func: async ({ name, targetAmount, deadline, category }) => {
          this.logger.log(`Setting goal: ${name}, ${targetAmount}, ${deadline}`);

          // Create goal object
          const goal: GoalTarget = {
            id: uuidv4(),
            name,
            targetAmount,
            currentAmount: 0,
            deadline,
            category: category || 'general',
          };

          this.logger.log(`Goal set with ID: ${goal.id}`);
          return {
            success: true,
            goal,
            message: `Goal "${name}" set successfully with a target of ${targetAmount} by ${deadline}.`
          };
        },
      }),
      new DynamicStructuredTool({
        name: 'updateGoalProgress',
        description: 'Update the progress of an existing goal',
        schema: z.object({
          goalId: z.string().describe('The ID of the goal to update'),
          currentAmount: z.number().describe('The current amount saved towards the goal'),
        }),
        func: async ({ goalId, currentAmount }) => {
          this.logger.log(`Updating goal progress: ${goalId}, ${currentAmount}`);

          // In a real implementation, we would update the goal in a database
          return {
            success: true,
            message: `Goal progress updated successfully to ${currentAmount}.`
          };
        },
      }),
    ];

    // Define system message
    const systemMessage = new SystemMessage(`You are a financial goals specialist.
Your role is to help users set and track their financial goals.
Use the setGoal tool to create new goals and updateGoalProgress to track progress.
Ask for specific details about the goal, including target amount and deadline.`);

    // Create the agent
    const agent = createReactAgent({
      llm: this.llm,
      tools,
      systemMessage,
    });

    // Return the node function
    return async (state: typeof AgentState.State) => {
      try {
        this.logger.log('Starting goals processing');

        // Process the state
        this.logger.log('Invoking goals agent with user message');
        const result = await agent.invoke({
          messages: state.messages,
          goals: state.goals || [],
        });

        this.logger.log('Goals agent processing complete, analyzing result');

        // Check for tool calls
        const toolCalls = result.messages
          .filter(message => message.additional_kwargs?.tool_calls)
          .flatMap(message => message.additional_kwargs.tool_calls);

        if (toolCalls?.length > 0) {
          this.logger.log(`Found ${toolCalls.length} tool calls in result`);

          // Process tool calls
          for (const call of toolCalls) {
            if (call.function.name === 'setGoal') {
              try {
                const args = JSON.parse(call.function.arguments);
                const goal: GoalTarget = {
                  id: uuidv4(),
                  name: args.name,
                  targetAmount: args.targetAmount,
                  currentAmount: 0,
                  deadline: args.deadline,
                  category: args.category || 'general',
                };

                // Update state with new goal
                state.goals = [...(state.goals || []), goal];

                this.logger.log(`Added goal to state: ${goal.id}`);
              } catch (parseError) {
                this.logger.error('Error parsing goal arguments:', parseError);
              }
            } else if (call.function.name === 'updateGoalProgress') {
              try {
                const args = JSON.parse(call.function.arguments);

                // Update goal progress
                if (state.goals) {
                  state.goals = state.goals.map(goal => {
                    if (goal.id === args.goalId) {
                      this.logger.log(`Updating goal ${goal.id} progress to ${args.currentAmount}`);
                      return {
                        ...goal,
                        currentAmount: args.currentAmount,
                      };
                    }
                    return goal;
                  });
                }
              } catch (parseError) {
                this.logger.error('Error parsing goal progress arguments:', parseError);
              }
            }
          }
        }

        this.logger.log('Goals processing complete');
        return {
          messages: result.messages || [],
          goals: state.goals,
          next: AGENT_NODES.MESSAGE_FORMATTER,
        };
      } catch (error) {
        this.logger.error('Error in GoalsAgent:', error);
        return {
          messages: [
            ...state.messages,
            new AIMessage('I encountered an error processing your goal request. Please try again with clearer details.'),
          ],
          next: AGENT_ACTIONS.FINISH,
        };
      }
    };
  }
}
```

## Best Practices

### 1. Tool Design

When designing tools for agents, follow these best practices:

- **Clear Names**: Use descriptive names that indicate the tool's purpose
- **Detailed Descriptions**: Provide clear descriptions of what the tool does
- **Comprehensive Schemas**: Define all parameters with appropriate types and descriptions
- **Meaningful Returns**: Return structured data with success indicators and messages
- **Proper Logging**: Log tool invocations and results for debugging

### 2. Error Handling

Implement comprehensive error handling:

- **Catch All Errors**: Use try/catch blocks around all async operations
- **Specific Error Types**: Define and use specific error types for different failure modes
- **Helpful Error Messages**: Provide user-friendly error messages
- **Detailed Logging**: Log errors with stack traces for debugging
- **Graceful Recovery**: Return a valid state update even when errors occur

### 3. Progress Tracking

Implement detailed progress tracking:

- **Start/End Logging**: Log when processing starts and completes
- **Step Logging**: Log each major processing step
- **Context Information**: Include relevant context in log messages
- **Performance Metrics**: Log timing information for performance analysis
- **Result Summaries**: Log summaries of processing results

### 4. State Management

Follow these practices for state management:

- **Immutable Updates**: Create new state objects rather than modifying existing ones
- **Complete State**: Return all relevant state fields in updates
- **Type Safety**: Use proper types for all state fields
- **Validation**: Validate state before and after updates
- **Clear Next Steps**: Always specify the next agent or action

## Migration Guide

When updating existing agents to follow the standardized patterns:

1. **Update Imports**: Add imports for DynamicStructuredTool, createReactAgent, and other required dependencies
2. **Define Interfaces**: Create interfaces for agent-specific data structures
3. **Convert to Tool-Based**: Replace prompt-based implementations with tool-based ones
4. **Add Error Handling**: Implement comprehensive error handling
5. **Add Progress Tracking**: Add detailed logging at key execution points
6. **Update Return Types**: Ensure consistent return types with proper typing

## Conclusion

Following these standardization patterns ensures a consistent, maintainable, and robust multi-agent system. These patterns improve type safety, error handling, and visibility into the system's operation, resulting in a better user experience and easier development process.
