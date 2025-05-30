# Workflow Management

## Overview

The Workflow Management system in Tamy Finance Assistant provides a structured approach to handling complex financial tasks that require multiple steps or agent collaboration. This document describes the current implementation of the workflow management system.

## Components

The workflow management system consists of two main components:

1. **WorkflowDetector**: Analyzes user requests to identify which workflow is needed
2. **WorkflowManager**: Manages the execution of workflows, including state transitions and agent coordination

## Workflow Detection

The `WorkflowDetector` analyzes user messages to determine which workflow is appropriate for handling the request. It uses a combination of pattern matching and semantic analysis to identify the workflow type.

```typescript
export class WorkflowDetector {
  detectWorkflow(message: string, state: AgentStateType): WorkflowType {
    // Analyze message to determine workflow type
    if (this.isBudgetingWorkflow(message)) {
      return WorkflowType.BUDGETING;
    } else if (this.isTransactionWorkflow(message)) {
      return WorkflowType.TRANSACTION_MANAGEMENT;
    } else if (this.isGoalWorkflow(message)) {
      return WorkflowType.GOAL_SETTING;
    } else if (this.isInsightWorkflow(message)) {
      return WorkflowType.INSIGHTS;
    } else if (this.isAccountWorkflow(message)) {
      return WorkflowType.ACCOUNT_MANAGEMENT;
    } else if (this.isCreditCardWorkflow(message)) {
      return WorkflowType.CREDIT_CARD_MANAGEMENT;
    }

    return WorkflowType.GENERAL;
  }

  // Implementation of detection methods...
}
```

## Workflow Types

The system currently supports the following workflow types:

| Workflow Type | Description | Primary Team |
|---------------|-------------|-------------|
| `BUDGETING` | Creating and managing budgets | Planning Team |
| `TRANSACTION_MANAGEMENT` | Recording and analyzing transactions | Tracking Team |
| `GOAL_SETTING` | Setting and tracking financial goals | Planning Team |
| `INSIGHTS` | Generating financial insights | Tracking Team |
| `ACCOUNT_MANAGEMENT` | Managing bank accounts | Management Team |
| `CREDIT_CARD_MANAGEMENT` | Managing credit cards | Management Team |
| `GENERAL` | General financial assistance | Supervisor |

## Workflow Execution

The `WorkflowManager` handles the execution of workflows, including:

1. **Initialization**: Setting up the initial state for the workflow
2. **Agent Routing**: Determining which agents need to be involved
3. **State Transitions**: Managing transitions between workflow states
4. **Error Handling**: Handling errors that occur during workflow execution
5. **Completion**: Finalizing the workflow and returning results

```typescript
export class WorkflowManager {
  async executeWorkflow(
    workflowType: WorkflowType,
    state: AgentStateType
  ): Promise<AgentStateType> {
    // Initialize workflow
    const initializedState = this.initializeWorkflow(workflowType, state);

    // Execute workflow steps
    let currentState = initializedState;
    let isComplete = false;

    while (!isComplete) {
      // Determine next step
      const nextStep = this.determineNextStep(workflowType, currentState);

      // Execute step
      currentState = await this.executeStep(nextStep, currentState);

      // Check if workflow is complete
      isComplete = this.isWorkflowComplete(workflowType, currentState);
    }

    // Finalize workflow
    return this.finalizeWorkflow(workflowType, currentState);
  }

  // Implementation of workflow management methods...
}
```

## Workflow States

Each workflow has a set of states that represent the progress of the workflow. For example, the budgeting workflow might have the following states:

1. **BUDGET_ANALYSIS**: Analyzing the user's current budget
2. **BUDGET_CREATION**: Creating a new budget
3. **BUDGET_ADJUSTMENT**: Adjusting an existing budget
4. **BUDGET_RECOMMENDATION**: Providing budget recommendations

## Integration with LangGraph

The workflow management system is integrated with LangGraph through the orchestrator. The orchestrator uses the workflow manager to handle complex tasks that require multiple agents or steps.

```typescript
@Injectable()
export class LangGraphOrchestratorService {
  constructor(
    // Other dependencies...
    private readonly workflowManager: WorkflowManager,
    private readonly workflowDetector: WorkflowDetector
  ) {}

  async processMessage(message: string, state: AgentStateType): Promise<AgentStateType> {
    // Detect workflow
    const workflowType = this.workflowDetector.detectWorkflow(message, state);

    // If a specific workflow is detected, use the workflow manager
    if (workflowType !== WorkflowType.GENERAL) {
      return this.workflowManager.executeWorkflow(workflowType, state);
    }

    // Otherwise, use the standard agent routing
    return this.routeToAgent(message, state);
  }

  // Implementation of other methods...
}
```

## Future Enhancements

Planned enhancements to the workflow management system include:

1. **Workflow Templates**: Predefined workflow templates for common financial tasks
2. **User-Defined Workflows**: Allow users to define custom workflows
3. **Workflow Visualization**: Visual representation of workflow progress
4. **Workflow Analytics**: Analytics on workflow performance and completion rates
5. **Parallel Workflow Steps**: Execute independent workflow steps in parallel for better performance
