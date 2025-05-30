# Conversational Design Patterns for Guided Experience

## Introduction

This document outlines reusable conversational design patterns for implementing guided experiences in Tamy Finance's multi-agent chatbot. These patterns provide consistent, effective ways to guide users through financial tasks, educate them about financial concepts, and help them achieve their financial goals through conversation. Each pattern includes usage guidelines, implementation details, and examples.

## Core Principles

All conversational guidance patterns should adhere to these principles:

1. **Unobtrusive**: Guidance should not interrupt the natural flow of conversation unless necessary
2. **Contextual**: Guidance should be relevant to the user's current task or situation
3. **Concise**: Guidance should be brief and focused on the immediate need
4. **Optional**: Users should be able to skip guidance or change topics when desired
5. **Consistent**: Guidance should use consistent language and conversation patterns
6. **Accessible**: Guidance should be accessible to all users, including those with different communication styles

## Conversational Guidance Pattern Library

### 1. Term Definitions

**Purpose**: Provide brief explanations of financial terms or concepts within the conversation.

**Usage Guidelines**:
- Use when users encounter unfamiliar financial terms
- Keep definitions brief and in plain language
- Provide definitions proactively when introducing complex terms
- Allow users to ask for more detailed explanations

**Implementation Details**:
- Detect when financial jargon is used in conversation
- Provide definitions without breaking conversational flow
- Use natural language for definitions
- Include examples where helpful

**Examples**:
```
User: "What's my credit utilization?"

Bot: "Credit utilization is the percentage of your available credit that you're currently using. It's an important factor in your credit score. Your current credit utilization is 28%, which is within the recommended range of under 30%."

User: "What does APR mean on my credit card?"

Bot: "APR stands for Annual Percentage Rate. It's the yearly interest rate you're charged when you carry a balance on your credit card. Your current APR is 18.99%, which means if you carry a $1,000 balance for a year, you'd pay about $190 in interest."
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
- Rent: $1,200
- Car payment: $350
- Subscriptions: $100

Next, let's look at your variable expenses like groceries, dining out, and entertainment. Would you like to continue, or save this and come back later?"
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
1. Would you like to set a dining budget for next month?
2. I can help you find patterns in your dining expenses
3. Would you like some tips for reducing food costs?"

User: "Let's set a budget."

Bot: "Great choice! Based on your income and other expenses, I recommend a dining budget of $200-250 per month. How does that sound?"
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
1. How to start building an emergency fund
2. Where to keep your emergency fund
3. When to use your emergency fund"

User: "How do I start building one?"

Bot: "To start building an emergency fund:
1. Set a target amount (typically 3-6 months of expenses)
2. Start small - even $500 can help with minor emergencies
3. Set up automatic transfers to a separate savings account
4. Gradually increase your contributions

Would you like me to help you calculate a target amount for your emergency fund?"
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
1. Set a new financial goal
2. Learn about building your credit score
3. Explore ways to use your freed-up cash flow"
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
1. Reduces your credit mix (the variety of credit accounts you have)
2. Lowers your average account age if it was an older account

Credit scores consider multiple factors: payment history (35%), credit utilization (30%), length of credit history (15%), credit mix (10%), and new credit (10%).

Your score should recover and potentially improve over time as your on-time payments on other accounts continue to build positive history. Would you like more details on any of these factors?"
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
- Your current rate: 4.5%
- Current loan balance: ~$280,000
- Time remaining: 25 years

Current market rates for your credit profile are around 3.25%.

Key considerations:
1. A refinance could save you approximately $190/month
2. Closing costs would be around $4,000-6,000
3. You'd break even on costs in about 2 years
4. You plan to stay in your home for at least 5 more years

Would you like to explore this further with a more detailed calculation?"
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
1. Create separate and joint account strategies that respect privacy while maintaining transparency
2. Develop a fair system for managing shared expenses
3. Facilitate a conversation about financial goals and priorities

Would any of these be helpful?"
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
1. Review your savings strategy
2. Adjust your goal timeline or amount
3. Get tips to accelerate your savings"

User: "Let's look at ways to save faster."

Bot: "Here are three personalized suggestions to boost your vacation savings:
1. I noticed your streaming subscriptions total $65/month. Temporarily pausing some could add $195 to your vacation fund over 3 months.
2. Your dining out expenses average $420/month. Reducing by 25% would add $315 to your savings over 3 months.
3. Setting up automatic transfers of $50 more per week would add $600 over 3 months.

Which of these would you like to explore further?"
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
- Housing: 35% ($1,400)
- Transportation: 15% ($600)
- Food: 20% ($800)
- Entertainment: 10% ($400)
- Other: 20% ($800)

Your food spending is 20% higher than last month. Would you like to see a detailed breakdown of your food expenses?"
```

## Pattern Combinations

These patterns can be combined to create comprehensive guided experiences:

### Onboarding Guidance Flow

Combine **Step-by-Step Guidance**, **Term Definitions**, **Progressive Disclosure**, and **Contextual Suggestions** to create an effective onboarding experience that:

1. Walks users through initial account setup
2. Explains key financial terms as they arise
3. Gradually introduces features and concepts
4. Suggests next steps based on user information

### Financial Decision Support

Combine **Guided Decision-Making**, **Contextual Education**, **Progressive Disclosure**, and **Conversational Guardrails** to help users make complex financial decisions by:

1. Breaking down the decision into key factors
2. Providing relevant educational content
3. Offering deeper information as needed
4. Guiding users away from potentially harmful choices

### Goal Achievement Support

Combine **Step-by-Step Guidance**, **Personalized Check-ins**, **Celebration Moments**, and **Contextual Suggestions** to support users in achieving financial goals by:

1. Breaking goals down into actionable steps
2. Checking in on progress at appropriate intervals
3. Celebrating milestones and achievements
4. Suggesting adjustments based on progress

## Implementation in LangGraph

### Integration with Agent System

These conversational patterns can be implemented in our LangGraph-based multi-agent system through:

1. **Pattern-specific prompt templates** that guide agent responses
2. **Guidance state tracking** in the conversation context
3. **Agent coordination** for complex pattern sequences
4. **Dynamic content selection** based on user context

### Example Implementation

```typescript
// Example implementation of Step-by-Step Guidance in LangGraph
const budgetCreationGuidance = defineGuidanceFlow({
  type: "BUDGET_CREATION",
  steps: [
    {
      id: "income",
      prompt: "Ask the user about their monthly income after taxes.",
      dataExtraction: {
        income: "number"
      },
      nextStep: "fixed_expenses"
    },
    {
      id: "fixed_expenses",
      prompt: "Ask the user about their fixed monthly expenses like rent, car payments, etc.",
      dataExtraction: {
        fixedExpenses: "Record<string, number>"
      },
      nextStep: "variable_expenses"
    },
    {
      id: "variable_expenses",
      prompt: "Ask the user about their variable expenses like groceries, dining, entertainment, etc.",
      dataExtraction: {
        variableExpenses: "Record<string, number>"
      },
      nextStep: "savings_goals"
    },
    {
      id: "savings_goals",
      prompt: "Ask the user about their savings goals.",
      dataExtraction: {
        savingsGoals: "Record<string, number>"
      },
      nextStep: "budget_creation"
    },
    {
      id: "budget_creation",
      prompt: "Create a budget based on the collected information and present it to the user.",
      dataExtraction: {
        budgetAccepted: "boolean"
      },
      nextStep: null
    }
  ]
});
```

## Next Steps

1. Prioritize patterns for implementation based on user needs
2. Develop a pattern library with example implementations
3. Create guidelines for when to use each pattern
4. Establish metrics to track pattern effectiveness
5. Implement high-priority patterns in the agent system

## References

- [Conversational Design Best Practices](https://www.nngroup.com/articles/conversation-design/)
- [Financial Chatbot Design Principles](https://www.boost.ai/articles/financial-chatbots)
- [Progressive Disclosure in Conversational Interfaces](https://www.interaction-design.org/literature/article/progressive-disclosure-hiding-complexity)
- [Designing for Trust in Financial Services](https://www.invisionapp.com/inside-design/designing-trust-financial-services/)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
