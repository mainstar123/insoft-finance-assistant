# Architecture

## Overview

Tamy Finance Assistant is built on a modular architecture that combines a multi-agent AI system with a robust backend infrastructure. The system is designed to be scalable, maintainable, and extensible, allowing for easy addition of new features and capabilities.

## System Components

The system consists of the following main components:

1. **AI Assistant Server**: The core backend server that hosts the multi-agent system and provides APIs for client applications
2. **Multi-Agent System**: A LangGraph.js-based implementation of specialized financial agents
3. **Communication Channels**: Interfaces for interacting with users through various channels (WhatsApp, web, etc.)
4. **Persistence Layer**: Storage for conversation history, user data, and financial information
5. **Media Processing**: Services for processing images, documents, and audio files
6. **External Integrations**: Connections to external financial services and APIs

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client Applications                         │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────┐    │
│  │   WhatsApp    │  │     Web       │  │     Mobile App    │    │
│  │   Interface   │  │   Interface   │  │     Interface     │    │
│  └───────┬───────┘  └───────┬───────┘  └─────────┬─────────┘    │
└─────────┼───────────────────┼───────────────────┼───────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Communication Layer                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │               Message Broker Service                     │    │
│  └─────────────────────────────┬───────────────────────────┘    │
└─────────────────────────────────┼───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     AI Assistant Server                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                LangGraph Integration Service             │    │
│  └─────────────────────────────┬───────────────────────────┘    │
│                                │                                 │
│                                ▼                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              LangGraph Orchestrator Service             │    │
│  │                                                         │    │
│  │  ┌─────────────┐                                        │    │
│  │  │ Supervisor  │                                        │    │
│  │  │   Agent     │                                        │    │
│  │  └──────┬──────┘                                        │    │
│  │         │                                               │    │
│  │         ▼                                               │    │
│  │  ┌─────────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │    │
│  │  │   Planning Team         │  │   Tracking Team     │  │   Management Team   │  │    │
│  │  │   Supervisor            │  │   Supervisor        │  │   Supervisor        │  │    │
│  │  └──────┬──────────────────┘  └──────┬──────────────┘  └──────┬──────────────┘  │    │
│  │         │                            │                        │                 │    │
│  │         ▼                            ▼                        ▼                 │    │
│  │  ┌──────┴──────┐  ┌──────────┐ ┌─────┴─────┐ ┌───────┐ ┌──────┴──────┐ ┌───────────┐ │    │
│  │  │ Budget      │  │ Goals    │ │Transaction│ │Insights│ │ Account     │ │Credit Card│ │    │
│  │  │ Agent       │  │ Agent    │ │ Agent     │ │ Agent  │ │ Agent       │ │ Agent     │ │    │
│  │  └─────────────┘  └──────────┘ └───────────┘ └───────┘ └─────────────┘ └───────────┘ │    │
│  │                                                                                      │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │    │
│  │  │ Education   │  │ Category    │  │Visualization │  │ Memory      │                 │    │
│  │  │ Agent       │  │ Agent       │  │ Agent        │  │ Manager     │                 │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                Media Processing Service                  │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │    │
│  │  │ Image       │  │ Document    │  │ Audio       │      │    │
│  │  │ Processing  │  │ Processing  │  │ Processing  │      │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Database Services                       │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │    │
│  │  │ PostgreSQL  │  │ Redis       │  │ Weaviate    │      │    │
│  │  │ (Main DB)   │  │ (Cache)     │  │ (Vector DB) │      │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     External Integrations                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────┐  │
│  │ OpenAI API  │  │ WhatsApp    │  │ Financial   │  │ Other  │  │
│  │             │  │ Business API│  │ Services    │  │ APIs   │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### AI Assistant Server

The AI Assistant Server is built using NestJS, a progressive Node.js framework for building efficient and scalable server-side applications. It provides:

- REST APIs for client applications
- WebSocket support for real-time communication
- Dependency injection for modular architecture
- Configuration management
- Logging and error handling

### Multi-Agent System

The multi-agent system is implemented using LangGraph.js, a framework for building complex AI agent workflows. It includes:

- **Supervisor Agent**: Routes user queries to specialized agents or team supervisors
- **Team Supervisors**: Coordinate groups of specialized agents for related tasks
- **Specialized Agents**: Handle specific financial tasks (Budget, Transaction, Goals, Insights, Education)
- **Memory Manager**: Maintains conversation history and context
- **Orchestrator**: Manages the flow of information between agents

### Communication Channels

The system supports multiple communication channels:

- **WhatsApp**: Integration with WhatsApp Business API for messaging
- **Web Interface**: REST API for web client applications
- **Mobile App**: REST API for mobile client applications

### Persistence Layer

The persistence layer includes:

- **PostgreSQL**: Main database for storing user data, transactions, budgets, and goals
- **Redis**: Cache for storing conversation state and session data
- **Weaviate**: Vector database for storing and retrieving semantic information

### Media Processing

The media processing services handle:

- **Image Processing**: Processing images of receipts, invoices, etc.
- **Document Processing**: Extracting information from PDF documents
- **Audio Processing**: Transcribing and processing audio messages

### External Integrations

The system integrates with external services:

- **OpenAI API**: For language model capabilities
- **WhatsApp Business API**: For WhatsApp messaging
- **Financial Services**: For retrieving financial data
- **Other APIs**: For additional functionality

## Data Flow

1. **User Input**: Users interact with the system through one of the communication channels
2. **Message Routing**: The Message Broker routes messages to the appropriate service
3. **Multi-Agent Processing**: The LangGraph Orchestrator processes messages through the multi-agent system
4. **Database Operations**: Agents interact with the database to store and retrieve data
5. **Response Generation**: The system generates responses based on agent outputs
6. **Response Delivery**: Responses are delivered back to the user through the appropriate channel

## Deployment Architecture

The system is designed to be deployed in a containerized environment using Docker and Kubernetes. This provides:

- **Scalability**: Ability to scale components independently
- **Reliability**: Automatic recovery from failures
- **Flexibility**: Easy deployment to different environments
- **Maintainability**: Simplified updates and rollbacks

## Security Architecture

The system implements multiple layers of security:

- **Authentication**: JWT-based authentication for API access
- **Authorization**: Role-based access control for different operations
- **Encryption**: Data encryption in transit and at rest
- **Input Validation**: Validation of all user inputs
- **Rate Limiting**: Protection against abuse and DoS attacks
- **Audit Logging**: Logging of all security-relevant events

## Conclusion

The architecture of Tamy Finance Assistant is designed to be modular, scalable, and maintainable. The use of LangGraph.js for the multi-agent system provides a powerful and flexible framework for building complex AI agent workflows, while the NestJS backend provides a robust and extensible foundation for the application. The system is designed to be deployed in a cloud environment and can be easily extended with new features and capabilities.
