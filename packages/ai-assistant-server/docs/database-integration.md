# Database Integration

## Overview

Tamy Finance Assistant uses multiple database technologies to store and manage different types of data. This document describes the current implementation of database integrations in the system.

## Database Technologies

The system uses the following database technologies:

1. **PostgreSQL**: Main relational database for storing structured data
2. **Redis**: In-memory database for caching and session management
3. **Weaviate**: Vector database for semantic search and retrieval

## Current Implementation

### PostgreSQL Integration

The PostgreSQL integration is implemented using Prisma ORM. The main database client is initialized in `src/core/integrations/database/db.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

export { prisma };
```

The database schema is defined in `src/core/integrations/database/prisma/schema.prisma` and includes models for:

- Users
- Accounts
- Transactions
- Categories
- Budgets
- Goals
- Credit Cards
- Invoices

Database seeding and management scripts are available in the package.json:

```json
"seed:minimal": "ts-node -r tsconfig-paths/register src/core/integrations/database/prisma/seed/minimal-seed.ts",
"db:drop": "ts-node -r tsconfig-paths/register src/core/integrations/database/prisma/drop-database.ts",
"db:reset": "ts-node -r tsconfig-paths/register src/core/integrations/database/prisma/reset-database.ts"
```

### Redis Integration

Redis is used for caching and session management. The Redis client is initialized using the `ioredis` package. The implementation is primarily used for:

- Storing conversation state
- Caching frequently accessed data
- Managing user sessions

### Weaviate Integration

Weaviate is used as a vector database for semantic search and retrieval. The Weaviate client is initialized using the `weaviate-ts-client` package. The implementation is primarily used for:

- Storing and retrieving vector embeddings
- Semantic search for financial knowledge
- Contextual information retrieval

## Database Access Patterns

The system uses repository patterns to abstract database access. Each feature module has its own repository that handles database operations for that feature. For example:

- `TransactionRepository`: Handles transaction-related database operations
- `BudgetRepository`: Handles budget-related database operations
- `GoalRepository`: Handles goal-related database operations

## Future Enhancements

Planned enhancements to the database integration include:

1. **Improved Migration Strategy**: Implement a more robust database migration strategy
2. **Connection Pooling**: Optimize database connections for better performance
3. **Sharding Strategy**: Implement database sharding for horizontal scaling
4. **Backup and Recovery**: Implement automated backup and recovery procedures
5. **Audit Logging**: Add comprehensive audit logging for database operations
