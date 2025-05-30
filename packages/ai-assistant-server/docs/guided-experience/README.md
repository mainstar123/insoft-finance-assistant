# Tamy Finance Guided Experience Documentation

## Overview

This documentation provides comprehensive guidance for implementing a guided experience in Tamy Finance's multi-agent chatbot system. A guided experience is essential for our target users who may have limited financial knowledge and need assistance in managing their finances effectively.

The guided experience approach focuses on:

- **Conversational guidance**: Providing step-by-step assistance through natural dialogue
- **Progressive disclosure**: Introducing features and concepts gradually to avoid overwhelming users
- **Contextual education**: Providing financial education at the moment it's most relevant
- **Personalized assistance**: Tailoring guidance based on user goals, challenges, and behavior
- **Confidence building**: Celebrating achievements and progress to build financial confidence

## Current Implementation

Tamy Finance currently implements guidance through our LangGraph-based multi-agent system:

- **Agent-integrated guidance**: Guidance capabilities are directly integrated into our specialized agents
- **Dynamic prompt generation**: All guidance is generated dynamically using LLMs
- **Language awareness**: All guidance is provided in the user's detected language
- **User preference tracking**: The system respects user preferences for guidance level
- **Flexible implementation**: The implementation is conversational and adaptive

## Documentation Structure

This folder contains the following documents that outline our vision for enhancing the current guidance system:

1. [**Guided Experience Overview**](./guided-experience-overview.md) - Philosophy, benefits, and key components of the guided experience approach

2. [**User Journey Mapping**](./user-journey-mapping.md) - Detailed mapping of user journeys with guidance touchpoints

3. [**Financial Education Integration**](./financial-education-integration.md) - Strategies for embedding financial education throughout the conversational experience

4. [**Personalization Framework**](./personalization-framework.md) - Guidelines for personalizing the guidance based on user data

5. [**Feature Roadmap**](./feature-roadmap.md) - Prioritized roadmap of features to enhance our guidance capabilities

6. [**Design Patterns**](./design-patterns.md) - Reusable patterns for implementing guidance in a conversational context. Note that while this document includes UI component examples, these should be interpreted as conversational equivalents in our multi-agent chatbot system. For example, "tooltips" would be implemented as brief explanations within the conversation, and "guided tours" would be step-by-step conversational guidance.

7. [**Metrics and Success**](./metrics-and-success.md) - KPIs and metrics to track the effectiveness of guided experiences

8. [**Implementation Guidelines**](./implementation-guidelines.md) - Technical guidelines for implementing guidance in our multi-agent system

## How to Use This Documentation

This documentation is designed to be used by the entire Tamy Finance team:

- **Product Managers**: Use the user journey mapping and feature roadmap to plan and prioritize guidance enhancements
- **AI Engineers**: Reference the implementation guidelines for integrating guidance into the agent system
- **Prompt Engineers**: Create effective guidance prompts following the design patterns
- **Content Writers**: Create educational content following the financial education integration guidelines
- **Data Scientists**: Track and analyze the metrics outlined in the metrics and success document

## Alignment with Multi-Agent Architecture

Our guided experience approach is designed to work seamlessly with our multi-agent architecture:

- **Specialized Agents**: Different guidance types are handled by specialized agents with domain expertise
- **Supervisor Coordination**: The supervisor agent coordinates guidance across different domains
- **State Management**: Guidance state is maintained as part of the conversation context
- **Tool Integration**: Guidance leverages agent tools to perform actions on behalf of users

## Contributing

This documentation is a living resource. As we learn more about our users and enhance our guidance capabilities, we should update these documents to reflect our evolving understanding of effective guided experiences.

To contribute:

1. Review the existing documentation
2. Make your changes or additions
3. Submit a pull request with a clear description of your changes
4. Seek feedback from the team

## Next Steps

1. Review the [Guided Experience Overview](./guided-experience-overview.md) to understand the philosophy and approach
2. Explore the [User Journey Mapping](./user-journey-mapping.md) to identify key guidance opportunities
3. Check the [Feature Roadmap](./feature-roadmap.md) for prioritized implementation plans
4. Reference the [Implementation Guidelines](./implementation-guidelines.md) for technical details
