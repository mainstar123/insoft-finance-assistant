# Guided Experience Overview

## Introduction

Tamy Finance aims to be more than just a financial tracking tool—it's designed to be a true financial guide that helps users improve their financial well-being through conversational AI. This document outlines our approach to creating a guided experience within our multi-agent chatbot system that supports users with limited financial knowledge.

## What is a Guided Experience in a Conversational Context?

A guided experience in the context of Tamy Finance's multi-agent chatbot refers to a proactive, supportive approach that:

1. **Anticipates user needs** and provides assistance before users encounter problems
2. **Reduces cognitive load** by breaking complex financial tasks into manageable conversational steps
3. **Educates users contextually** about financial concepts when they're most relevant
4. **Builds confidence** through positive reinforcement and celebration of progress
5. **Adapts to user knowledge levels** by personalizing guidance based on observed behavior
6. **Maintains natural conversation** while providing structured guidance

## Why Guided Experiences Matter for Financial Chatbots

Financial management is inherently complex and often emotionally charged. Our users face several challenges:

- **Financial anxiety**: Many users feel stressed or anxious about their finances
- **Knowledge gaps**: Users may lack understanding of basic financial concepts
- **Decision paralysis**: Too many options can lead to indecision or avoidance
- **Low confidence**: Users may doubt their ability to make good financial decisions
- **Inconsistent habits**: Financial management requires consistent engagement
- **Chatbot uncertainty**: Users may be unsure how to effectively interact with a financial AI assistant

A guided experience addresses these challenges by:

- Reducing anxiety through clear, step-by-step conversational guidance
- Filling knowledge gaps with contextual education
- Simplifying decisions with smart recommendations
- Building confidence through positive feedback and small wins
- Encouraging habit formation through gentle nudges and reminders
- Providing structured conversation paths that help users achieve their goals

## Core Principles of Guided Experiences

### 1. Conversational Progressive Disclosure

Introduce complexity gradually through conversation:

- Start with essential concepts and simple questions
- Deepen the conversation as users demonstrate understanding
- Provide "just enough" information in each message
- Offer paths to learn more when users express interest

### 2. Contextual Education

Deliver financial education at the moment it's most relevant:

- Explain concepts when they arise naturally in conversation
- Connect abstract concepts to the user's specific situation
- Use plain language and relatable examples
- Provide deeper educational resources for interested users

### 3. Personalized Guidance

Tailor the conversation based on user data:

- Adapt guidance based on stated goals and challenges
- Modify recommendations based on observed behavior
- Respect different learning styles and preferences
- Recognize and respond to user progress

### 4. Positive Reinforcement

Build confidence through celebration and encouragement:

- Celebrate progress and achievements, no matter how small
- Frame setbacks as learning opportunities
- Provide encouraging feedback for positive behaviors
- Use conversational elements to make achievements meaningful

### 5. Frictionless Assistance

Make help readily available without disrupting the conversation:

- Provide proactive guidance at potential points of confusion
- Make help accessible but not intrusive
- Maintain context awareness throughout the conversation
- Balance structured guidance with natural conversation

## Current Implementation in Our Multi-Agent System

Our LangGraph-based multi-agent system currently implements guided experiences through:

### 1. Specialized Guidance Agents

Different agents provide domain-specific guidance:

- **Financial Agent**: Guides users through budgeting, account management, etc.
- **Analysis Agent**: Helps users understand their financial patterns
- **Education Agent**: Provides financial literacy content
- **Supervisor Agent**: Coordinates guidance across different domains

### 2. Guidance Service

Our `GuidanceService` provides:

- Initialization of guidance sessions for specific tasks
- Step-by-step advancement through guidance flows
- Data extraction from user responses
- Dynamic prompt generation for guidance steps
- Language-aware guidance in the user's preferred language

### 3. Guidance Types

We currently support several guidance types:

- **Budget Creation** - Guides users through creating a budget
- **Goal Setting** - Helps users set up financial goals
- **Transaction Analysis** - Analyzes spending patterns and transactions
- **Financial Planning** - Provides comprehensive financial planning
- **Debt Management** - Helps users manage and reduce debt
- **Account Setup** - Guides users through setting up financial accounts
- **Category Organization** - Helps users organize spending/income categories
- **User Account Creation** - Guides users through creating a user account

### 4. User Preference Adaptation

Our system adapts to user preferences for guidance detail:

- **Detailed** - Comprehensive guidance with explanations and examples
- **Standard** - Clear guidance with some explanation
- **Minimal** - Concise guidance with minimal explanation
- **None** - Only essential instructions

## Enhancement Opportunities

While our current implementation provides effective guidance, we've identified several enhancement opportunities:

### 1. Enhanced Personalization

Improve personalization through:

- More sophisticated user profiling
- Adaptive guidance based on conversation history
- Learning from user interactions to refine guidance

### 2. Expanded Educational Content

Enhance financial education through:

- More comprehensive financial concept explanations
- Personalized learning paths based on user goals
- Multi-modal educational content (text, links, visualizations)

### 3. Improved Guidance Detection

Better identify when users need guidance:

- More sophisticated intent recognition
- Proactive guidance offers based on user behavior
- Seamless transitions between free conversation and guided flows

### 4. Enhanced Metrics and Analytics

Improve our understanding of guidance effectiveness:

- Comprehensive tracking of guidance interactions
- Analysis of guidance completion rates
- Measurement of financial outcomes from guidance

## Examples from Successful Financial Assistants

### Cleo

- **Conversational financial guidance**: Uses casual, friendly language to guide users
- **Proactive insights**: Identifies spending patterns and suggests improvements
- **Gamified challenges**: Creates engaging savings challenges through conversation

### Charlie

- **Step-by-step debt guidance**: Walks users through debt reduction strategies
- **Negotiation assistance**: Guides users through bill negotiation processes
- **Accountability follow-ups**: Checks in on progress toward financial goals

### Plum

- **Automated savings guidance**: Explains automatic savings rules through conversation
- **Investment education**: Provides conversational education about investment options
- **Behavioral insights**: Offers insights about spending habits in a conversational way

## Next Steps

To enhance our guided experience implementation:

1. Review the [User Journey Mapping](./user-journey-mapping.md) document to identify key guidance opportunities
2. Explore the [Design Patterns](./design-patterns.md) for reusable conversational guidance patterns
3. Check the [Feature Roadmap](./feature-roadmap.md) for prioritized implementation plans
4. Reference the [Implementation Guidelines](./implementation-guidelines.md) for technical details

## References

- [Conversational AI Design: Best Practices](https://www.rasa.com/blog/conversational-ai-design-best-practices/)
- [Financial Chatbot Design: Creating Engaging Experiences](https://www.boost.ai/articles/financial-chatbots)
- [LangGraph: Building Stateful Multi-Agent Applications](https://python.langchain.com/docs/langgraph)
- [Designing Effective Guided Conversations](https://www.nngroup.com/articles/conversation-design/)
