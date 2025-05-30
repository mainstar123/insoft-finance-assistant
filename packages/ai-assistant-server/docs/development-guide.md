# Development Guide

## Introduction

This guide provides instructions for setting up the development environment and contributing to the Tamy Finance Assistant project. It covers environment setup, code organization, testing, and contribution guidelines.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v20 or later)
- **pnpm** (v8 or later)
- **Git**
- **Docker** and **Docker Compose** (for containerized development)

## Environment Setup

### 1. Clone the Repository

   ```bash
git clone https://github.com/your-organization/tamy-finance-assistant.git
   cd tamy-finance-assistant
   ```

### 2. Install Dependencies

The project uses a monorepo structure with pnpm workspaces. Install all dependencies with:

   ```bash
   pnpm install
   ```

### 3. Set Up Environment Variables

Copy the example environment file and update it with your configuration:

   ```bash
cd packages/ai-assistant-server
cp .env.example .env
   ```

Edit the `.env` file to include your API keys and configuration. At minimum, you need to set:

   ```
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:4500/tamy-ai
REDIS_URL=redis://localhost:6379
WEAVIATE_URL=http://localhost:8080

# Persistence
PERSISTENCE_TYPE=memory # Use 'redis' for production
```

### 4. Start Required Services

Start the required services (PostgreSQL, Redis, Weaviate) using Docker Compose:

   ```bash
cd ../../ # Navigate to the root of the monorepo
docker-compose up -d
```

### 5. Start the Development Server

   ```bash
cd packages/ai-assistant-server
pnpm dev
   ```

This will start the server with hot-reloading enabled.

## Project Structure

The AI Assistant Server follows a modular architecture:

```
src/
├── core/                    # Core functionality
│   ├── services/            # Core services
│   │   ├── media-processing/# Media processing services
│   │   └── ...              # Other core services
│   ├── messaging/           # Message broker and communication
│   ├── integrations/        # External integrations
│   ├── interfaces/          # Common interfaces
│   ├── utils/               # Utility functions
│   └── config/              # Configuration
├── features/                # Feature modules
│   ├── langgraph/           # LangGraph multi-agent system
│   │   ├── agents/          # Agent implementations
│   │   │   ├── base-agent.ts# Base agent class
│   │   │   ├── supervisor-agent.ts # Supervisor agent
│   │   │   ├── team-supervisors.ts # Team supervisors
│   │   │   ├── budget-agent.ts # Budget agent
│   │   │   ├── transaction-agent.ts # Transaction agent
│   │   │   ├── goals-agent.ts # Goals agent
│   │   │   ├── insights-agent.ts # Insights agent
│   │   │   └── education-agent.ts # Education agent
│   │   ├── memory/          # Memory management
│   │   ├── persistence/     # State persistence
│   │   ├── tools/           # Agent tools
│   │   ├── types/           # Type definitions
│   │   ├── utils/           # Utilities
│   │   ├── state.ts         # State definitions
│   │   ├── orchestrator.ts  # Orchestrator service
│   │   └── langgraph-integration.service.ts # Integration service
│   ├── user/                # User management
│   ├── transaction/         # Transaction management
│   ├── budget/              # Budget management
│   ├── goal/                # Goal management
│   ├── category/            # Category management
│   ├── account/             # Account management
│   └── ...                  # Other feature modules
├── common/                  # Common utilities and interfaces
├── app.module.ts            # Main application module
└── main.ts                  # Application entry point
```

## Development Workflow

### Starting the Application

To start the application in development mode:

```bash
npm run start:dev
```

This will start the application with hot-reload enabled.

### Database Management

The project includes several scripts for managing the database during development:

- `npm run db:migrate`: Run database migrations to create or update the database schema
- `npm run db:seed`: Seed the database with initial data
- `npm run db:drop`: Drop all tables in the database (useful for resetting the database completely)
- `npm run db:reset`: Drop all tables, run migrations, and seed the database (a complete reset)

These commands are useful in different scenarios:

- Use `db:migrate` when you've added new migrations and need to update your database schema
- Use `db:seed` when you want to populate your database with initial data
- Use `db:drop` when you want to completely clear your database
- Use `db:reset` when you want to start fresh with a clean database (commonly used when you've made significant changes to the database schema or seed data)

When running the database seed (`npm run db:seed` or `npm run db:reset`), a default account is automatically created for each user. This simplifies development and testing by ensuring that each user has an associated account without requiring manual account creation. The default account uses standard values and is linked to the user's phone number.

### Creating a New Agent

To create a new specialized agent:

1. Create a new file in the `agents` directory, e.g., `investment-agent.ts`
2. Extend the `BaseLangGraphAgent` class
3. Implement the `createNode` method
4. Define the agent's tools and system message
5. Register the agent in the `langgraph.module.ts` file
6. Update the `orchestrator.ts` file to include the new agent in the graph

Example:

```typescript
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { BaseLangGraphAgent } from './base-agent';
import { AgentStateType } from '../state';

@Injectable()
export class InvestmentAgent extends BaseLangGraphAgent {
  createNode() {
    const tools = [
      new DynamicStructuredTool({
        name: 'analyzePortfolio',
        description: 'Analyze an investment portfolio',
        schema: z.object({
          // Tool parameters
        }),
        func: async (params) => {
          // Tool implementation
        },
      }),
      // Other tools...
    ];

    const systemMessage = `You are an Investment Agent specialized in helping users analyze and optimize their investment portfolios...`;

    const agent = this.createReactAgentNode(tools, systemMessage, 'Investment Agent');

    return async (state: AgentStateType) => {
    try {
        // Process the state using the agent
        const result = await agent.invoke(state);

        // Return the result
        return result;
    } catch (error) {
        return this.handleError(error, state);
    }
    };
  }
}
```

### Modifying the State

To modify the state structure:

1. Update the state definitions in `state.ts`
2. Add new annotations with appropriate reducers
3. Update the `PublicStateSchema` and other schemas as needed
4. Update the `orchestrator.ts` file to handle the new state components

Example:

```typescript
// Add a new state component for investments
export const AgentState = Annotation.Root({
  // Existing state components...

  // New state component
  investments: Annotation<Investment[]>({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),
});
```

### Adding a New Tool

To add a new tool to an agent:

1. Define the tool using `DynamicStructuredTool` with a Zod schema
2. Implement the tool's functionality
3. Add the tool to the agent's tools array

Example:

```typescript
const tools = [
  // Existing tools...

  // New tool
  new DynamicStructuredTool({
    name: 'calculateReturnOnInvestment',
    description: 'Calculate the return on investment',
    schema: z.object({
      initialInvestment: z.number().describe('The initial investment amount'),
      finalValue: z.number().describe('The final value of the investment'),
      years: z.number().describe('The number of years'),
    }),
    func: async ({ initialInvestment, finalValue, years }) => {
      const roi = (finalValue - initialInvestment) / initialInvestment;
      const annualizedRoi = Math.pow(1 + roi, 1 / years) - 1;

      return {
        roi: roi * 100,
        annualizedRoi: annualizedRoi * 100,
      };
    },
  }),
];
```

## Testing

### Unit Tests

Unit tests are written using Jest. To run the tests:

```bash
npm run test
```

To run tests with coverage:

```bash
npm run test:cov
```

### Writing Tests

Tests should be placed in the `test` directory or alongside the files they test with a `.spec.ts` suffix.

Example test for an agent:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BudgetAgent } from './budget-agent';

describe('BudgetAgent', () => {
  let agent: BudgetAgent;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BudgetAgent],
    }).compile();

    agent = module.get<BudgetAgent>(BudgetAgent);
  });

  it('should be defined', () => {
    expect(agent).toBeDefined();
  });

  it('should create a node', () => {
    const node = agent.createNode();
    expect(node).toBeDefined();
  });

  // More tests...
});
```

### Integration Tests

Integration tests verify that different components work together correctly. They are placed in the `test` directory with an `.e2e-spec.ts` suffix.

To run integration tests:

```bash
npm run test:e2e
```

## Debugging

### Logging

The application uses NestJS's built-in logger. Each class has its own logger instance:

```typescript
private readonly logger = new Logger(MyClass.name);

// Usage
this.logger.log('This is an informational message');
this.logger.debug('This is a debug message');
this.logger.warn('This is a warning message');
this.logger.error('This is an error message', error.stack);
```

### Debugging with VS Code

To debug the application with VS Code, add the following configuration to your `.vscode/launch.json` file:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug NestJS",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["run", "start:debug"],
      "sourceMaps": true,
      "envFile": "${workspaceFolder}/packages/ai-assistant-server/.env",
      "cwd": "${workspaceFolder}/packages/ai-assistant-server",
      "console": "integratedTerminal"
    }
  ]
}
```

## Code Style and Linting

The project uses ESLint and Prettier for code style and linting. To check your code:

```bash
npm run lint
```

To automatically fix linting issues:

```bash
npm run lint:fix
```

To format your code with Prettier:

```bash
npm run format
```

## Contribution Guidelines

### Branching Strategy

- `main`: Production-ready code
- `develop`: Development branch for integrating features
- `feature/feature-name`: Feature branches for new features
- `bugfix/bug-name`: Bugfix branches for fixing bugs

### Pull Request Process

1. Create a new branch from `develop` for your feature or bugfix
2. Make your changes and commit them with descriptive commit messages
3. Push your branch to the repository
4. Create a pull request to merge your branch into `develop`
5. Ensure all tests pass and the code meets the style guidelines
6. Request a review from at least one team member
7. Address any feedback from the review
8. Once approved, the branch will be merged into `develop`

### Commit Message Guidelines

Follow the conventional commits format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Changes to the build process or auxiliary tools

Example:
```
feat(budget-agent): add budget recommendation tool

Add a new tool to the Budget Agent that provides recommendations for budget adjustments based on spending patterns.

Closes #123
```

## Deployment

### Building for Production

To build the application for production:

```bash
npm run build
```

This will create a production-ready build in the `dist` directory.

### Docker Deployment

The project includes a Dockerfile for containerized deployment:

```bash
# Build the Docker image
docker build -t tamy-finance-assistant .

# Run the container
docker run -p 3000:3000 --env-file .env tamy-finance-assistant
```

## Troubleshooting

### Common Issues

#### OpenAI API Key Issues

If you encounter errors related to the OpenAI API key:

1. Check that your API key is correctly set in the `.env` file
2. Ensure the API key has the necessary permissions
3. Check for rate limiting or quota issues

#### Database Connection Issues

If you have trouble connecting to the database:

1. Verify the `DATABASE_URL` in your `.env` file
2. Ensure the database server is running
3. Check that the database user has the necessary permissions

#### WhatsApp API Issues

If WhatsApp integration is not working:

1. Verify your WhatsApp API key and phone number in the `.env` file
2. Check that your WhatsApp Business account is properly set up
3. Ensure the webhook URL is correctly configured

## Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [LangChain.js Documentation](https://js.langchain.com/docs/)
- [LangGraph.js Documentation](https://langchain-ai.github.io/langgraphjs/)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp/api/)
