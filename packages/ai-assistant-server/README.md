# AI Assistant Server

The AI Assistant Server is the backend component of the Tamy Finance Assistant. It implements a multi-agent system using LangGraph.js to provide personalized financial assistance to users.

## Features

- Multi-agent system with specialized financial agents
- LangGraph.js implementation for agent orchestration
- State management with proper reducers
- Memory management for maintaining context across conversations
- Integration with communication channels (WhatsApp, web, etc.)
- Persistence layer for storing conversation history and financial data
- Model cascading for cost-efficient LLM usage
- Parallel processing of agent tasks for improved performance
- Response streaming for better user experience
- Optimized database queries for faster data retrieval

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later)
- **pnpm** (v8 or later)
- **Docker** and **Docker Compose** (for running the required services)

## Getting Started

### 1. Set Up Environment Variables

Copy the example environment file and update it with your configuration:

```bash
cp .env.example .env
```

The `.env` file contains the following configuration:

```
# General Configuration
FRONTEND_URL=<frontend-url>
CORS_ORIGIN=<cors-origin>
APP_URL=<app-url>
NODE_ENV=development
PORT=3000

# Database Configuration
REDIS_URL=<redis-url>
WEAVIATE_URL=<weaviate-url>
DATABASE_URL=<database-url>

# Whatsapp Configuration
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<whatsapp-webhook-verify-token>
WHATSAPP_APP_SECRET=<whatsapp-app-secret>
WHATSAPP_API_KEY=<whatsapp-api-key>
WHATSAPP_API_URL=<whatsapp-api-url>
WHATSAPP_PHONE_NUMBER_ID=<whatsapp-phone-number-id>
WHATSAPP_WABA_ID=<whatsapp-waba-id>
WHATSAPP_PASSPHRASE=<whatsapp-passphrase>
WHATSAPP_PRIVATE_KEY=<whatsapp-private-key>

# Email Configuration
SENDGRID_API_KEY=<sendgrid-api-key>
SENDGRID_EMAIL_FROM=<sendgrid-email-from>

# Tool and Collaboration Timeouts
AI_AGENTS_COLLABORATION_TIMEOUT=<ai-agents-collaboration-timeout>
AI_AGENTS_TOOLS_TIMEOUT=<ai-agents-tools-timeout>

# OpenAI API Key
OPENAI_API_KEY=<openai-api-key>

# OpenAI Model Configuration
OPENAI_MODEL_NAME=gpt-4
OPENAI_SMALL_MODEL=gpt-3.5-turbo
OPENAI_MEDIUM_MODEL=gpt-3.5-turbo-16k
OPENAI_LARGE_MODEL=gpt-4

# Multimodal Configuration
MAX_FILE_SIZE_MB=10
MEDIA_STORAGE_PATH=<media-storage-path>
ALLOWED_FILE_TYPES=pdf,csv,jpg,jpeg,png,mp3,mp4,wav

# Persistence
PERSISTENCE_TYPE=<persistence-type (redis|memory)>
PERSISTENCE_REDIS_URL=<persistence-redis-url>
```

At minimum, you need to set:
- `OPENAI_API_KEY`: Your OpenAI API key
- `DATABASE_URL`: Your PostgreSQL connection string (e.g., `postgresql://postgres:postgres@localhost:4500/tamy-ai`)
- `WEAVIATE_URL`: Your Weaviate URL (e.g., `http://localhost:8080`)
- `REDIS_URL`: Your Redis URL (e.g., `redis://localhost:6379`)

### 2. Start the Required Services

The AI Assistant Server requires PostgreSQL, Redis, and Weaviate. You can start these services using Docker Compose from the root of the monorepo:

```bash
cd ../../ && docker-compose up -d
```

This will start:
- PostgreSQL on port 4500
- Redis on port 6379
- Weaviate on port 8080

### 3. Install Dependencies

If you haven't already installed dependencies at the monorepo level, you can install them for this package:

```bash
pnpm install
```

### 4. Start the Development Server

```bash
pnpm dev
```

This will start the server with hot-reloading enabled.

## Project Structure

```
src/
├── core/                    # Core functionality
│   ├── messaging/           # Message broker and communication
│   └── config/              # Configuration
├── features/                # Feature modules
│   ├── langgraph/           # LangGraph multi-agent system
│   │   ├── agents/          # Agent implementations
│   │   ├── core/            # Core orchestration components
│   │   │   ├── model-cascading/  # Model cascading for cost efficiency
│   │   │   ├── parallel-processing/ # Parallel processing for performance
│   │   │   ├── streaming/   # Response streaming
│   │   │   ├── database/    # Database query optimization
│   │   │   └── orchestrator.ts # Main orchestrator
│   │   ├── memory/          # Memory management
│   │   ├── persistence/     # State persistence
│   │   ├── tools/           # Agent tools
│   │   ├── utils/           # Utilities
│   │   ├── state.ts         # State definitions
│   │   └── langgraph-integration.service.ts # Integration service
│   ├── user/                # User management
│   ├── transaction/         # Transaction management
│   └── ...                  # Other feature modules
├── app.module.ts            # Main application module
└── main.ts                  # Application entry point
```

## API Endpoints

### Message Processing

- `POST /langgraph/message` - Process a chat message
- `GET /langgraph/message/stream` - Process a chat message with streaming response
- `POST /langgraph/parallel` - Process multiple agents in parallel

### Conversation Management

- `GET /langgraph/conversation/:threadId` - Get conversation history
- `POST /langgraph/conversation/:threadId/reset` - Reset a conversation

## Performance Optimizations

### Model Cascading

The system uses a tiered approach to LLM usage:
- Small models (gpt-3.5-turbo) for simple tasks
- Medium models (gpt-3.5-turbo-16k) for moderate complexity
- Large models (gpt-4) only when necessary

This approach significantly reduces token usage and API costs while maintaining quality.

### Parallel Processing

Agents that don't depend on each other's outputs can be executed in parallel, reducing overall response time. The system automatically determines which agents can be parallelized based on their dependencies.

### Response Streaming

Real-time streaming of responses provides a better user experience by showing incremental results as they're generated, rather than waiting for the complete response.

### Database Query Optimization

Optimized database queries with efficient joins, pagination, and parallel execution of independent queries for faster data retrieval.

## Development Workflow

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:cov

# Run end-to-end tests
pnpm test:e2e
```

### Linting and Formatting

```bash
# Run linting
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format
```

### Building for Production

```bash
pnpm build
```

This will create a production-ready build in the `dist` directory.

## Documentation

For detailed documentation about the AI Assistant Server, refer to the following resources:

- [Architecture Overview](./docs/architecture.md)
- [Agent System](./docs/agent-system.md)
- [Development Guide](./docs/development-guide.md)
- [State Management](./docs/state-management.md)
- [Memory Management](./docs/memory-management.md)
- [Improvement Recommendations](./docs/improvement-recommendations.md)
- [Roadmap](./docs/roadmap.md)

## Adding a New Agent

To add a new specialized agent:

1. Create a new file in the `src/features/langgraph/agents` directory, e.g., `investment-agent.ts`
2. Extend the `BaseLangGraphAgent` class
3. Implement the `createNode` method
4. Define the agent's tools and system message
5. Register the agent in the `langgraph.module.ts` file
6. Update the `orchestrator.ts` file to include the new agent in the graph

For a detailed guide on creating new agents, see the [Development Guide](./docs/development-guide.md).

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

## Contributing

Please read our [Development Guide](./docs/development-guide.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the [MIT License](../../LICENSE).
