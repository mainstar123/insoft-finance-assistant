# Agent System

## Overview

Tamy Finance Assistant uses a multi-agent system where each agent specializes in a specific financial domain. The system is built using LangGraph.js, a framework for building complex AI agent workflows. This document describes the current implementation of the multi-agent system, including the agent architecture, state management, and orchestration.

## Agent Architecture

The multi-agent system follows a hierarchical architecture:

- A **Supervisor Agent** acts as the central hub, analyzing user requests and routing them to specialized agents or team supervisors
- **Team Supervisors** coordinate groups of specialized agents for related tasks
- **Specialized Agents** handle specific financial tasks and return results to their supervisor
- The **Orchestrator** manages the flow of information between agents and maintains the system state

This architecture allows for specialization and modularity, with each agent focusing on a specific domain of financial expertise.

### Current Agent Types

The system currently includes the following agent types:

| Agent Type | Description |
|------------|-------------|
| `SUPERVISOR` | Routes user queries to specialized agents or team supervisors |
| `PLANNING_TEAM_SUPERVISOR` | Coordinates agents related to financial planning |
| `TRACKING_TEAM_SUPERVISOR` | Coordinates agents related to financial tracking |
| `MANAGEMENT_TEAM_SUPERVISOR` | Coordinates agents related to account and credit card management |
| `BUDGET_AGENT` | Helps users plan and track their budgets |
| `GOALS_AGENT` | Assists with setting and tracking financial goals |
| `TRANSACTION_AGENT` | Records and categorizes financial transactions |
| `INSIGHTS_AGENT` | Provides insights and analysis of financial data |
| `ACCOUNT_AGENT` | Manages bank accounts and related operations |
| `CREDIT_CARD_AGENT` | Handles credit card management and analysis |
| `CATEGORY_AGENT` | Manages transaction categories and classification |
| `VISUALIZATION_AGENT` | Creates visual representations of financial data |
| `EDUCATION_AGENT` | Provides educational content about financial concepts |

### Team Structure

The agents are organized into teams for better coordination:

#### Planning Team
- **Supervisor**: `PLANNING_TEAM_SUPERVISOR`
- **Members**: `BUDGET_AGENT`, `GOALS_AGENT`
- **Purpose**: Coordinate financial planning activities

#### Tracking Team
- **Supervisor**: `TRACKING_TEAM_SUPERVISOR`
- **Members**: `TRANSACTION_AGENT`, `INSIGHTS_AGENT`
- **Purpose**: Coordinate financial tracking and analysis activities

#### Management Team
- **Supervisor**: `MANAGEMENT_TEAM_SUPERVISOR`
- **Members**: `ACCOUNT_AGENT`, `CREDIT_CARD_AGENT`
- **Purpose**: Coordinate account and credit card management activities

The `EDUCATION_AGENT`, `CATEGORY_AGENT`, and `VISUALIZATION_AGENT` operate independently and can be called by any team or the main supervisor.

## State Management

All agents share a common state structure defined using LangGraph.js annotations. This approach provides proper state management with reducers that handle state updates correctly.

### State Structure

The state includes the following components:

```typescript
export const AgentState = Annotation.Root({
  // Messages passed between agents
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  // The next agent to route to
  next: Annotation<string>({
    reducer: (x, y) => y ?? x ?? END,
    default: () => END,
  }),
  // User information
  user: Annotation<User>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  // Transaction data
  transactions: Annotation<Transaction[]>({
    reducer: (x, y) => [...(x || []), ...(y || [])],
    default: () => [],
  }),
  // Budget information
  budget: Annotation<Budget>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({ limits: {}, spent: {} }),
  }),
  // Financial goals
  goals: Annotation<Goal[]>({
    reducer: (x, y) => [...(x || []), ...(y || [])],
    default: () => [],
  }),
  // Financial insights
  insights: Annotation<Insight[]>({
    reducer: (x, y) => [...(x || []), ...(y || [])],
    default: () => [],
  }),
  // Educational content
  educationalContent: Annotation<EducationalContent[]>({
    reducer: (x, y) => [...(x || []), ...(y || [])],
    default: () => [],
  }),
  // Conversation context
  context: Annotation<Context>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({ conversationId: '', timestamp: '' }),
  }),
});
```

## Agent Implementation

Each agent is implemented as a class that extends the `BaseLangGraphAgent` class. This base class provides common functionality for all agents, including:

- Agent creation using the REACT pattern
- Error handling
- Logging
- Tool registration

### Agent Tools

Each specialized agent has access to a set of tools specific to its domain:

- **Budget Agent**: Create budget, update budget, check budget, get budget recommendations
- **Transaction Agent**: Record transaction, get transactions, categorize transaction, analyze spending
- **Goals Agent**: Create goal, update goal progress, check goal status, get goal recommendations
- **Insights Agent**: Generate insights, analyze spending patterns, identify savings opportunities
- **Education Agent**: Get educational content, explain financial concepts, provide financial tips

## Orchestration

The `LangGraphOrchestratorService` manages the flow of information between agents:

1. User messages are received by the system
2. The Supervisor Agent analyzes the message and determines the appropriate routing
3. If the request requires a team effort, it's routed to the appropriate Team Supervisor
4. The Team Supervisor coordinates the specialized agents to fulfill the request
5. Results are collected and returned to the user

This orchestration ensures that each request is handled by the most appropriate agent or team, providing specialized expertise while maintaining a coherent user experience.
