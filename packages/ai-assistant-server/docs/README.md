# Tamy Finance Assistant Documentation

## Overview

This documentation provides comprehensive information about the Tamy Finance Assistant, a multi-agent AI system built using LangGraph.js for providing personalized financial assistance to users.

## Table of Contents

1. [Architecture](./architecture.md)
   - System components
   - High-level architecture diagram
   - Communication flow

2. [Agent System](./agent-system.md)
   - Multi-agent architecture
   - Agent types and responsibilities
   - Team structure

3. [AI Orchestrator](./ai-orchestrator.md)
   - State graph implementation
   - Command routing
   - Context management

4. [State Management](./state-management.md)
   - State structure
   - Reducers
   - State transitions

5. [Memory Management](./memory-management.md)
   - Conversation history
   - Context window management
   - Persistence strategies

6. [Communication Channels](./communication-channels.md)
   - Current implementation
   - Planned enhancements
   - Channel abstraction

7. [Database Integration](./database-integration.md)
   - PostgreSQL integration
   - Redis integration
   - Weaviate integration

8. [Workflow Management](./workflow-management.md)
   - Workflow detection
   - Workflow execution
   - Workflow types

9. [Development Guide](./development-guide.md)
   - Environment setup
   - Adding new agents
   - Testing and deployment

10. [Roadmap](./roadmap.md)
    - Planned features
    - Future improvements
    - Release schedule

11. [Multimodal Capabilities](./multimodal.md)
    - Image processing
    - Document processing
    - Audio processing

12. [Agent Standardization](./agent-standardization.md)
    - Current implementation status
    - Standardization patterns
    - Tool definitions

13. [Improvement Recommendations](./improvement-recommendations.md)
    - Best practices
    - Performance optimization
    - Cost efficiency
    - User experience enhancements

14. [Additional Use Cases](./additional-use-cases.md)
    - Financial education chatbot
    - Receipt scanning and expense tracking
    - Investment portfolio management
    - And more potential enhancements

## Current Implementation

The current implementation includes:

- **Multi-Agent System**: A supervisor-based architecture with specialized agents (Budget, Transaction, Goals, Insights, Account, Credit Card, Category, Visualization, Education) and team supervisors (Planning, Tracking, Management).

- **LangGraph Integration**: Using LangGraph.js for orchestration with a centralized state management approach.

- **Communication Channels**: WhatsApp integration for messaging.

- **Persistence**: In-memory persistence with Redis support for production.

- **Media Processing**: Support for processing images, documents, and audio files.

- **Database Integration**: PostgreSQL database for storing user data, transactions, budgets, and goals.

## Getting Started

For detailed instructions on setting up the development environment and contributing to the project, see the [Development Guide](./development-guide.md).

## Recent Updates

- Added team supervisors for better agent coordination
- Implemented multimodal processing capabilities
- Enhanced state management with proper reducers
- Added comprehensive error handling
- Improved memory management for conversation context
- Added database management scripts for easier development workflow
- Implemented automatic default account creation during seeding
- Fixed LangGraph orchestrator to properly handle conversation end routing
