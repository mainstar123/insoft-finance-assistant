# Tamy Finance Assistant

Tamy Finance Assistant is an AI-powered personal financial assistant designed to help users achieve their financial goals through education and intelligent financial management. The name "Tamy" stands for "Talking About Money," reflecting our mission to remove the taboo around discussing money matters while providing a conversational interface for financial management.

## Project Overview

This is a monorepo containing the following packages:

- `packages/ai-assistant-server`: The backend server with the multi-agent AI system
- `packages/web-client`: The web client application (frontend)
- `packages/shared`: Shared utilities and types

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later)
- **pnpm** (v8 or later)
- **Git**
- **Docker** and **Docker Compose** (for running the required services)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-organization/tamy-finance-assistant.git
cd tamy-finance-assistant
```

### 2. Install Dependencies

The project uses pnpm workspaces for managing dependencies across packages:

```bash
pnpm install
```

### 3. Set Up Environment Variables

Copy the example environment files and update them with your configuration:

```bash
cp packages/ai-assistant-server/.env.example packages/ai-assistant-server/.env
# Update the .env file with your configuration
```

### 4. Start the Required Services

The project requires PostgreSQL, Redis, and Weaviate. You can start these services using Docker Compose:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 4500
- Redis on port 6379
- Weaviate on port 8080

### 5. Start the Development Server

```bash
# Start the AI Assistant Server
pnpm --filter=packages/ai-assistant-server dev

# In another terminal, start the Web Client (if available)
pnpm --filter=packages/web-client dev
```

## Development Workflow

### Running Tests

```bash
# Run tests for all packages
pnpm test

# Run tests for a specific package
pnpm --filter=packages/ai-assistant-server test
```

### Linting and Formatting

```bash
# Lint all packages
pnpm lint

# Format all packages
pnpm format
```

### Building for Production

```bash
# Build all packages
pnpm build

# Build a specific package
pnpm --filter=packages/ai-assistant-server build
```

### Continuous Integration

We use GitHub Actions for continuous integration. The following workflows are configured:

- **PR Checks**: Runs linting, tests, and build checks on all pull requests to the main branch.
- **AI Assistant Server Checks**: Runs specific checks for the AI assistant server when changes are made to that package.
- **Deploy to Railway**: Automatically deploys the AI assistant server to Railway when changes are pushed to the main branch.

## Deployment

### Railway Deployment

The AI Assistant Server can be deployed to [Railway](https://railway.app/), a modern app hosting platform. We've configured the project with the necessary files for Railway deployment:

- `railway.json`: Configuration file for Railway deployment
- `.github/workflows/railway-deploy.yml`: GitHub Actions workflow for automated deployment

For detailed instructions on deploying to Railway, see [Railway Deployment Guide](packages/ai-assistant-server/RAILWAY_DEPLOYMENT.md).

## Documentation

For detailed documentation about the project, refer to the following resources:

- [Architecture Overview](packages/ai-assistant-server/docs/architecture.md)
- [Agent System](packages/ai-assistant-server/docs/agent-system.md)
- [Development Guide](packages/ai-assistant-server/docs/development-guide.md)
- [State Management](packages/ai-assistant-server/docs/state-management.md)
- [Memory Management](packages/ai-assistant-server/docs/memory-management.md)
- [Roadmap](packages/ai-assistant-server/docs/roadmap.md)

## Contributing

Please read our [Development Guide](packages/ai-assistant-server/docs/development-guide.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the [MIT License](LICENSE).

## Contact

For questions or support, please contact the development team at [dev@insoft.ai](mailto:dev@tamy.finance).
