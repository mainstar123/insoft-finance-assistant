# Chatbot Design Patterns for Guided Experience

## Introduction

This document outlines reusable conversational design patterns for the Tamy Finance multi-agent chatbot. These patterns are designed to guide users through financial tasks, educate them about financial concepts, and help them achieve their financial goals through conversation. The patterns in this document are specifically tailored for implementation in our LangGraph-based multi-agent system.

## Core Principles

All conversational guidance patterns should adhere to the following principles:

1. **Unobtrusive**: Guidance should not interrupt the natural flow of conversation or force users down a predetermined path.
2. **Contextually Relevant**: Guidance should be provided at the right moment, based on the user's current task, history, and needs.
3. **Concise**: Guidance should be brief and to the point, avoiding overwhelming the user with information.
4. **Optional**: Users should be able to dismiss or ignore guidance without consequences.
5. **Consistent**: Guidance patterns should be applied consistently throughout the conversation experience.
6. **Accessible**: Guidance should be understandable to users with varying levels of financial knowledge.

## Conversational Guidance Pattern Library

### 1. Term Definitions

**Purpose**: To provide brief, clear explanations of financial terms within the conversation flow.

**Usage Guidelines**:
- Use when a user encounters a potentially unfamiliar financial term
- Provide definitions that are concise and jargon-free
- Include a practical example when possible
- Mention related terms when relevant

**Implementation Details**:
- Implement as a component that can be inserted into any agent's response
- Include the term, definition, example, and related terms
- Adapt complexity based on user segment (new vs. experienced)

**Example**:
```
User: What's a good APY for a savings account?

Bot: **APY (Annual Percentage Yield)** is the real rate of return you earn on a savings account, including the effect of compounding interest.

For example, if you deposit $1,000 in an account with 2% APY, you'll have $1,020 after one year.

Related terms: Interest Rate, Compound Interest, High-Yield Savings Account

Currently, a good APY for a savings account is typically between 3-5%, though this varies based on economic conditions.
```

**LangGraph Implementation**:
```typescript
class TermDefinitionComponent implements PatternComponent {
  id: string;
  pattern: ConversationalPattern = ConversationalPattern.TERM_DEFINITION;
  term: string;
  definition: string;
  example: string;
  relatedTerms: string[];

  constructor(props: {
    id: string;
    term: string;
    definition: string;
    example: string;
    relatedTerms?: string[];
  }) {
    this.id = props.id;
    this.term = props.term;
    this.definition = props.definition;
    this.example = props.example;
    this.relatedTerms = props.relatedTerms || [];
  }

  render(context: UserContext): string {
    return `**${this.term}** is ${this.definition}\n\n` +
           `For example, ${this.example}\n\n` +
           (this.relatedTerms.length > 0 ?
             `Related terms: ${this.relatedTerms.join(', ')}\n\n` : '');
  }
}
```

### 2. Step-by-Step Guidance

**Purpose**: Guide users through complex financial tasks by breaking them down into manageable steps.

**Usage Guidelines**:
- Use for multi-step processes like budget creation or goal setting
- Clearly indicate progress through the process
- Allow users to pause and resume the process
- Provide options to skip steps or get more details

**Implementation Details**:
- Maintain state of the current step in the guidance flow
- Provide clear transitions between steps
- Validate user input at each step before proceeding
- Allow for non-linear navigation when appropriate

**Examples**:
```
User: "I want to create a budget."
Bot: "Great! I can help you create a budget in a few simple steps. First, let's identify your monthly income. How much do you earn each month after taxes?"
User: "About $3,500."
Bot: "Thanks! $3,500 per month is a good starting point. Now, let's identify your fixed expenses - these are bills that stay roughly the same each month, like rent, car payments, or subscriptions. What are your major fixed expenses?"
User: "Rent is $1,200, car payment is $350, and I pay about $100 for subscriptions."
Bot: "Got it! I've recorded:
Rent: $1,200
Car payment: $350
Subscriptions: $100
Next, let's look at your variable expenses like groceries, dining out, and entertainment. Would you like to continue, or save this and come back later?"
```

**LangGraph Implementation**:
```typescript
interface Step {
  number: number;
  instruction: string;
  explanation: string;
}

class StepByStepGuidanceComponent implements PatternComponent {
  id: string;
  pattern: ConversationalPattern = ConversationalPattern.STEP_BY_STEP_GUIDANCE;
  title: string;
  steps: Step[];

  constructor(props: {
    id: string;
    title: string;
    steps: Step[];
  }) {
    this.id = props.id;
    this.title = props.title;
    this.steps = props.steps;
  }

  render(context: UserContext): string {
    let result = `I can guide you through ${this.title}:\n\n`;

    this.steps.forEach(step => {
      result += `${this.getNumberEmoji(step.number)} **${step.instruction}**: ${step.explanation}\n\n`;
    });

    result += `Would you like me to explain any of these steps in more detail?`;
    return result;
  }

  private getNumberEmoji(num: number): string {
    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    return num <= 10 ? emojis[num-1] : `${num}.`;
  }
}
```

### 3. Contextual Suggestions

**Purpose**: Provide relevant suggestions based on the user's current situation or conversation context.

**Usage Guidelines**:
- Offer suggestions that are directly relevant to the current topic
- Present a limited number of options (2-4) to avoid overwhelming users
- Make suggestions actionable and clear
- Use suggestions to guide users toward beneficial financial behaviors

**Implementation Details**:
- Analyze conversation context to determine relevant suggestions
- Personalize suggestions based on user data and history
- Present suggestions in a consistent format
- Track which suggestions users act upon to improve future recommendations

**Examples**:
```
User: "I spent too much on dining out this month."
Bot: "I see that your dining expenses are $320 this month, which is 40% higher than your monthly average. Here are some suggestions:
Would you like to set a dining budget for next month?
I can help you find patterns in your dining expenses
Would you like some tips for reducing food costs?"
User: "Let's set a budget."
Bot: "Great choice! Based on your income and other expenses, I recommend a dining budget of $200-250 per month. How does that sound?"
```

**LangGraph Implementation**:
```typescript
interface Suggestion {
  title: string;
  explanation: string;
  benefit: string;
}

class ContextualSuggestionsComponent implements PatternComponent {
  id: string;
  pattern: ConversationalPattern = ConversationalPattern.CONTEXTUAL_SUGGESTIONS;
  context: string;
  suggestions: Suggestion[];

  constructor(props: {
    id: string;
    context: string;
    suggestions: Suggestion[];
  }) {
    this.id = props.id;
    this.context = props.context;
    this.suggestions = props.suggestions;
  }

  render(userContext: UserContext): string {
    let result = `Based on ${this.context}, here are some suggestions that might help:\n\n`;

    this.suggestions.forEach(suggestion => {
      result += `💡 **${suggestion.title}**: ${suggestion.explanation} ${suggestion.benefit}\n\n`;
    });

    result += `Would any of these approaches interest you?`;
    return result;
  }
}
```

### 4. Progressive Disclosure

**Purpose**: Gradually reveal information and options to avoid overwhelming users with too much at once.

**Usage Guidelines**:
- Start with essential information and gradually add details
- Provide clear options to learn more about specific topics
- Match information complexity to user expertise level
- Use progressive disclosure for educational content

**Implementation Details**:
- Structure content in layers of increasing detail
- Provide clear signals for accessing more information
- Track user engagement with detailed content to adjust future disclosures
- Maintain conversation context when revealing additional information

**Examples**:
```
User: "Tell me about emergency funds."
Bot: "An emergency fund is money you set aside for unexpected expenses or financial hardships. Financial experts typically recommend saving 3-6 months of essential expenses.
Would you like to know:
How to start building an emergency fund
Where to keep your emergency fund
When to use your emergency fund"
User: "How do I start building one?"
Bot: "To start building an emergency fund:
Set a target amount (typically 3-6 months of expenses)
Start small - even $500 can help with minor emergencies
Set up automatic transfers to a separate savings account
Gradually increase your contributions
Would you like me to help you calculate a target amount for your emergency fund?"
```

**LangGraph Implementation**:
```typescript
interface DisclosureLevel {
  level: number;
  content: string;
}

interface DisclosureOption {
  id: number;
  topic: string;
  content: string;
}

class ProgressiveDisclosureComponent implements PatternComponent {
  id: string;
  pattern: ConversationalPattern = ConversationalPattern.PROGRESSIVE_DISCLOSURE;
  initialContent: string;
  options: DisclosureOption[];

  constructor(props: {
    id: string;
    initialContent: string;
    options: DisclosureOption[];
  }) {
    this.id = props.id;
    this.initialContent = props.initialContent;
    this.options = props.options;
  }

  render(context: UserContext): string {
    let result = `${this.initialContent}\n\n`;

    if (this.options.length > 0) {
      result += `Would you like to know more about:\n`;
      this.options.forEach(option => {
        result += `${option.id}. ${option.topic}\n`;
      });
    }

    return result;
  }
}
```

### 5. Celebration Moments

**Purpose**: Acknowledge and celebrate user achievements to build confidence and motivation.

**Usage Guidelines**:
- Celebrate meaningful financial milestones
- Keep celebrations proportional to the achievement
- Personalize celebrations based on user goals
- Use celebrations to reinforce positive financial behaviors

**Implementation Details**:
- Identify meaningful achievement triggers
- Create celebration messages that feel authentic and personal
- Include specific details about the achievement
- Suggest next steps or goals when appropriate

**Examples**:
```
User: "I just made the final payment on my credit card!"
Bot: "🎉 Congratulations! That's a significant achievement! Paying off your $3,200 credit card debt is a major financial milestone. You've been consistently working toward this goal for 8 months - your dedication has paid off!
Would you like to:
Set a new financial goal
Learn about building your credit score
Explore ways to use your freed-up cash flow"
```

**LangGraph Implementation**:
```typescript
class CelebrationMomentsComponent implements PatternComponent {
  id: string;
  pattern: ConversationalPattern = ConversationalPattern.CELEBRATION_MOMENTS;
  achievement: string;
  impact: string;
  nextSteps: string;

  constructor(props: {
    id: string;
    achievement: string;
    impact: string;
    nextSteps: string;
  }) {
    this.id = props.id;
    this.achievement = props.achievement;
    this.impact = props.impact;
    this.nextSteps = props.nextSteps;
  }

  render(context: UserContext): string {
    return `🎉 **Congratulations on ${this.achievement}!** That's a major financial milestone that took dedication and discipline.\n\n` +
           `${this.impact}\n\n` +
           `${this.nextSteps}`;
  }
}
```

### 6. Contextual Education

**Purpose**: Provide educational content at the moment it's most relevant to the user's situation.

**Usage Guidelines**:
- Deliver education when users are dealing with related topics
- Keep educational content brief and focused
- Connect abstract concepts to the user's specific situation
- Provide options for deeper learning

**Implementation Details**:
- Identify teachable moments in the conversation
- Maintain a library of educational content snippets
- Personalize examples based on user data
- Track engagement with educational content

**Examples**:
```
User: "Why did my credit score drop after I paid off my loan?"
Bot: "Great question. Sometimes paying off a loan can temporarily lower your credit score because it:
Reduces your credit mix (the variety of credit accounts you have)
Lowers your average account age if it was an older account
Credit scores consider multiple factors: payment history (35%), credit utilization (30%), length of credit history (15%), credit mix (10%), and new credit (10%).
Your score should recover and potentially improve over time as your on-time payments on other accounts continue to build positive history. Would you like more details on any of these factors?"
```

**LangGraph Implementation**:
```typescript
class ContextualEducationComponent implements PatternComponent {
  id: string;
  pattern: ConversationalPattern = ConversationalPattern.CONTEXTUAL_EDUCATION;
  concept: string;
  explanation: string;
  example: string;
  personalApplication: string;

  constructor(props: {
    id: string;
    concept: string;
    explanation: string;
    example: string;
    personalApplication: string;
  }) {
    this.id = props.id;
    this.concept = props.concept;
    this.explanation = props.explanation;
    this.example = props.example;
    this.personalApplication = props.personalApplication;
  }

  render(context: UserContext): string {
    let result = `${this.explanation}\n\n`;

    if (this.example) {
      result += `For example, ${this.example}\n\n`;
    }

    if (this.personalApplication) {
      result += `${this.personalApplication}`;
    }

    return result;
  }
}
```

### 7. Guided Decision-Making

**Purpose**: Help users make informed financial decisions by walking them through key considerations.

**Usage Guidelines**:
- Use when users face complex financial decisions
- Present pros and cons objectively
- Personalize considerations based on user's situation
- Avoid making the final decision for the user

**Implementation Details**:
- Break decisions down into key factors
- Gather relevant user information through conversation
- Present personalized analysis
- Provide clear next steps regardless of decision

**Examples**:
```
User: "Should I refinance my mortgage?"
Bot: "That's an important decision that depends on several factors. Let me help you think through it:
Current situation:
Your current rate: 4.5%
Current loan balance: ~$280,000
Time remaining: 25 years
Current market rates for your credit profile are around 3.25%.
Key considerations:
A refinance could save you approximately $190/month
Closing costs would be around $4,000-6,000
You'd break even on costs in about 2 years
You plan to stay in your home for at least 5 more years
Would you like to explore this further with a more detailed calculation?"
```

**LangGraph Implementation**:
```typescript
interface Option {
  title: string;
  pros: string[];
  cons: string[];
}

class GuidedDecisionMakingComponent implements PatternComponent {
  id: string;
  pattern: ConversationalPattern = ConversationalPattern.GUIDED_DECISION_MAKING;
  decision: string;
  options: Option[];
  personalizedAnalysis: string;

  constructor(props: {
    id: string;
    decision: string;
    options: Option[];
    personalizedAnalysis: string;
  }) {
    this.id = props.id;
    this.decision = props.decision;
    this.options = props.options;
    this.personalizedAnalysis = props.personalizedAnalysis;
  }

  render(context: UserContext): string {
    let result = `This is a common financial dilemma. Let me help you think through this decision:\n\n`;

    this.options.forEach((option, index) => {
      result += `**Option ${index + 1}: ${option.title}**\n`;

      option.pros.forEach(pro => {
        result += `✅ ${pro}\n`;
      });

      option.cons.forEach(con => {
        result += `❌ ${con}\n`;
      });

      result += `\n`;
    });

    result += `**Personalized analysis**: ${this.personalizedAnalysis}\n\n`;
    result += `What other factors are important to you in this decision?`;

    return result;
  }
}
```

### 8. Conversational Guardrails

**Purpose**: Gently guide users back to productive financial conversations when they go off-topic or request inappropriate actions.

**Usage Guidelines**:
- Use when conversations drift from financial topics
- Implement for potentially harmful financial requests
- Keep redirections friendly and non-judgmental
- Offer relevant alternatives

**Implementation Details**:
- Identify off-topic or potentially harmful requests
- Acknowledge the user's request respectfully
- Explain limitations clearly
- Suggest productive alternatives

**Examples**:
```
User: "Can you help me hide money from my spouse?"
Bot: "I understand financial relationships can be complicated. However, I'm designed to help with transparent financial management that builds trust. Instead, I could help you:
Create separate and joint account strategies that respect privacy while maintaining transparency
Develop a fair system for managing shared expenses
Facilitate a conversation about financial goals and priorities
Would any of these be helpful?"
```

**LangGraph Implementation**:
```typescript
interface Alternative {
  description: string;
}

class ConversationalGuardrailsComponent implements PatternComponent {
  id: string;
  pattern: ConversationalPattern = ConversationalPattern.CONVERSATIONAL_GUARDRAILS;
  topic: string;
  acknowledgment: string;
  limitation: string;
  alternatives: Alternative[];

  constructor(props: {
    id: string;
    topic: string;
    acknowledgment: string;
    limitation: string;
    alternatives: Alternative[];
  }) {
    this.id = props.id;
    this.topic = props.topic;
    this.acknowledgment = props.acknowledgment;
    this.limitation = props.limitation;
    this.alternatives = props.alternatives;
  }

  render(context: UserContext): string {
    let result = `${this.acknowledgment} ${this.limitation}\n\n`;

    if (this.alternatives.length > 0) {
      result += `I can help you in other ways:\n\n`;

      this.alternatives.forEach((alt, index) => {
        result += `${index + 1}. ${alt.description}\n`;
      });

      result += `\nWould any of these alternatives be helpful for you?`;
    }

    return result;
  }
}
```

### 9. Personalized Check-ins

**Purpose**: Proactively check in with users about their progress toward financial goals or important financial tasks.

**Usage Guidelines**:
- Schedule check-ins at appropriate intervals
- Make check-ins relevant to user goals and activities
- Keep check-ins brief and focused
- Provide clear value in each check-in

**Implementation Details**:
- Track user goals and important financial dates
- Determine appropriate check-in timing and frequency
- Personalize check-in content based on user data
- Provide actionable next steps

**Examples**:
```
Bot: "Hi there! It's been 30 days since you set your goal to save $5,000 for a vacation. You've saved $1,200 so far, which puts you slightly ahead of schedule. Great work!
Would you like to:
Review your savings strategy
Adjust your goal timeline or amount
Get tips to accelerate your savings"
User: "Let's look at ways to save faster."
Bot: "Here are three personalized suggestions to boost your vacation savings:
I noticed your streaming subscriptions total $65/month. Temporarily pausing some could add $195 to your vacation fund over 3 months.
Your dining out expenses average $420/month. Reducing by 25% would add $315 to your savings over 3 months.
Setting up automatic transfers of $50 more per week would add $600 over 3 months.
Which of these would you like to explore further?"
```

**LangGraph Implementation**:
```typescript
class PersonalizedCheckInsComponent implements PatternComponent {
  id: string;
  pattern: ConversationalPattern = ConversationalPattern.PERSONALIZED_CHECK_INS;
  goal: string;
  timeframe: string;
  progress: string;
  nextStepOptions: string[];

  constructor(props: {
    id: string;
    goal: string;
    timeframe: string;
    progress: string;
    nextStepOptions: string[];
  }) {
    this.id = props.id;
    this.goal = props.goal;
    this.timeframe = props.timeframe;
    this.progress = props.progress;
    this.nextStepOptions = props.nextStepOptions;
  }

  render(context: UserContext): string {
    let result = `I noticed it's been ${this.timeframe} since we discussed your goal of ${this.goal}. How has that been going?\n\n`;

    if (this.progress) {
      result += `${this.progress}\n\n`;
    }

    if (this.nextStepOptions.length > 0) {
      result += `Would you like to:\n`;
      this.nextStepOptions.forEach((option, index) => {
        result += `${index + 1}. ${option}\n`;
      });
    }

    return result;
  }
}
```

### 10. Multi-Modal Guidance

**Purpose**: Enhance conversational guidance with visual or interactive elements when appropriate.

**Usage Guidelines**:
- Use when visual information would significantly enhance understanding
- Ensure visual elements have clear conversational context
- Provide text alternatives for all visual content
- Use consistent visual formatting

**Implementation Details**:
- Identify when visual elements would be beneficial
- Generate or retrieve appropriate visual content
- Ensure visual elements are accessible
- Maintain conversation context when sharing visual content

**Examples**:
```
User: "How is my spending broken down this month?"
Bot: "Here's a breakdown of your spending this month:
[Pie Chart: Monthly Spending by Category]
Housing: 35% ($1,400)
Transportation: 15% ($600)
Food: 20% ($800)
Entertainment: 10% ($400)
Other: 20% ($800)
Your food spending is 20% higher than last month. Would you like to see a detailed breakdown of your food expenses?"
```

**LangGraph Implementation**:
```typescript
interface DataPoint {
  category: string;
  trend: 'increase' | 'decrease' | 'stable';
  before: string;
  after: string;
}

class MultiModalGuidanceComponent implements PatternComponent {
  id: string;
  pattern: ConversationalPattern = ConversationalPattern.MULTI_MODAL_GUIDANCE;
  visualReference: string;
  summary: string;
  dataPoints: DataPoint[];
  insight: string;

  constructor(props: {
    id: string;
    visualReference: string;
    summary: string;
    dataPoints: DataPoint[];
    insight: string;
  }) {
    this.id = props.id;
    this.visualReference = props.visualReference;
    this.summary = props.summary;
    this.dataPoints = props.dataPoints;
    this.insight = props.insight;
  }

  render(context: UserContext): string {
    let result = `${this.summary}\n\n`;

    result += `[${this.visualReference}]\n\n`;

    this.dataPoints.forEach(point => {
      const emoji = point.trend === 'increase' ? '📈' : point.trend === 'decrease' ? '📉' : '📊';
      result += `${emoji} **${point.category}**: ${point.trend === 'increase' ? 'Increased' : point.trend === 'decrease' ? 'Decreased' : 'Remained stable'} from ${point.before} to ${point.after}\n`;
    });

    result += `\n${this.insight}`;

    return result;
  }
}
```

## Pattern Combinations

Certain scenarios benefit from combining multiple patterns for a more comprehensive guided experience:

### Onboarding Flow
- **Step-by-Step Guidance** to walk through initial setup
- **Term Definitions** to explain financial concepts
- **Progressive Disclosure** to avoid overwhelming new users
- **Contextual Education** to build financial literacy

### Goal Setting
- **Guided Decision-Making** to help users choose appropriate goals
- **Contextual Suggestions** to recommend specific actions
- **Multi-Modal Guidance** to visualize progress scenarios
- **Celebration Moments** to acknowledge milestones

### Financial Education
- **Term Definitions** to explain concepts
- **Progressive Disclosure** to layer information
- **Contextual Education** to relate concepts to personal finances
- **Multi-Modal Guidance** to visualize complex concepts

## Implementation in LangGraph

The implementation of these design patterns in our LangGraph-based multi-agent system follows a modular approach that allows for flexible composition of prompts based on user context and agent type.

### Modular Prompt Architecture

We've implemented a modular prompt system with the following key components:

1. **Prompt Components**: Self-contained, reusable prompt segments that can be combined to create complete prompts
2. **Prompt Registry**: Central service for registering and retrieving prompt components
3. **Prompt Builder**: Service for assembling prompts from components based on context
4. **Token Optimizer**: Service for ensuring prompts fit within token limits
5. **User-Specific Templates**: Pre-configured templates for different user types

This architecture allows us to:
- Reuse common prompt elements across different agents
- Adapt prompts based on user context and preferences
- Optimize token usage by including only relevant components
- Version and test individual components independently

### Core Interfaces

The system is built around the `PromptComponent` interface:

```typescript
export enum PromptComponentType {
  IDENTITY = 'identity',
  CAPABILITY = 'capability',
  INSTRUCTION = 'instruction',
  EXAMPLE = 'example',
  CONTEXT = 'context',
  PATTERN = 'pattern'
}

export enum UserType {
  REGISTERED = 'registered',
  UNREGISTERED = 'unregistered'
}

export interface PromptContext {
  userType: UserType;
  userContext: any;
  language: string;
  agentType?: string;
  currentMessage?: string;
}

export interface PromptComponent {
  id: string;
  type: PromptComponentType;
  render(context: PromptContext): string;
  isApplicable(context: PromptContext): boolean;
}
```

### Pattern Implementation

Each conversational design pattern is implemented as a separate component that can be included in prompts as needed:

1. **Term Definition Pattern**: Provides brief explanations of financial terms within conversations
2. **Step-by-Step Guidance Pattern**: Breaks down complex financial tasks into manageable steps
3. **Contextual Education Pattern**: Delivers relevant financial education based on user context
4. **Personalized Check-ins Pattern**: Follows up on user's financial goals and progress

### Example Usage

Here's how an agent would use the modular prompt system:

```typescript
// Create prompt context
const promptContext: PromptContext = {
  userType: UserType.REGISTERED,
  userContext: userContext,
  language: 'pt-BR',
  agentType: 'BUDGET_AGENT',
  currentMessage: message,
};

// Build the prompt using the component-based approach
const prompt = promptBuilder.buildPrompt(promptContext, [
  'identity',
  'company_info',
  'user_context',
  'budget_agent',
  'term_definition_pattern',
  'step_by_step_guidance_pattern',
  'contextual_education_pattern',
]);

// Optimize the prompt to fit within token limits
const optimizedPrompt = tokenOptimizer.optimizePrompt(prompt, MAX_TOKENS);
```

## Next Steps

1. **Create a Component Library**: Implement each pattern as a reusable component in the codebase
2. **Develop Pattern Templates**: Create templates for common scenarios that combine multiple patterns
3. **Implement User Segment Adapters**: Build adapters to customize patterns for different user segments
4. **Build Dynamic Assembly Service**: Create a service to dynamically assemble prompts with appropriate patterns
5. **Develop Testing Framework**: Create tests to ensure patterns produce expected outputs
6. **Create Documentation**: Document each pattern with examples for developers
7. **Implement Tracking**: Add analytics to track pattern effectiveness
8. **Establish Review Process**: Create a process for reviewing and improving patterns based on user interactions

## References

- [LangChain Prompt Templates](https://js.langchain.com/docs/modules/model_io/prompts/prompt_templates/)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Conversational UX Best Practices](https://www.nngroup.com/articles/conversation-design/)
- [Financial Literacy Guidelines](https://www.consumerfinance.gov/consumer-tools/educator-tools/youth-financial-education/)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
