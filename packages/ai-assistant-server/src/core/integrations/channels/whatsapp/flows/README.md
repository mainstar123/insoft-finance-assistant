# WhatsApp Flows

This module implements a flow-based system for handling WhatsApp interactions, particularly for user registration and onboarding.

## Architecture

The WhatsApp flows module follows a modular architecture with clear separation of concerns:

1. **WhatsAppFlowsController**: Handles incoming flow requests and routes them to the appropriate service.
2. **WhatsAppBaseFlowService**: Provides common functionality for all flows, such as help and reset commands.
3. **WhatsAppRegistrationFlowService**: Implements the user registration flow.

## Flow Structure

The registration flow follows a multi-step process:

1. **ENTRY**: Welcome screen with an introduction to Tamy Finance.
2. **ACCOUNT_CREATION_BASIC**: Collects basic user information (name, email, password).
3. **ACCOUNT_CREATION_PERSONAL**: Collects personal information (birth date, gender, country).
4. **ACCOUNT_CREATION_GOALS**: Collects financial goals and preferences.
5. **ACCOUNT_CREATION_SUCCESS**: Confirms successful account creation and provides next steps.

## Usage

### Handling Flow Requests

The `WhatsAppFlowsController` exposes an endpoint for handling registration flow requests:

```
POST /whatsapp/flows/register-user
```

The request body should follow the `WhatsAppFlowRequestDto` format:

```typescript
{
  event: WhatsAppWebhookEvent;
  screenId?: string;
  formData?: Record<string, any>;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
}
```

### Flow Response

The response follows the `WhatsAppFlowResponseDto` format:

```typescript
{
  success: boolean;
  message?: string;
  nextScreen?: string;
  terminal?: boolean;
  data?: Record<string, any>;
  actions?: WhatsAppFlowActionDto[];
}
```

## Implementation Details

### State Management

The flow maintains state through the `data` field in the request/response. Each step adds its data to this object, which is passed to subsequent steps.

### Error Handling

The flow includes robust error handling:

1. Common errors are caught and logged.
2. User-friendly error messages are sent back to the user.
3. The flow can recover from certain errors by returning to previous steps.

### User Experience

The flow is designed to provide a smooth user experience:

1. Clear instructions at each step.
2. Validation of user inputs.
3. Ability to navigate back to previous steps if needed.
4. Help command available at any point.

## Extending the Flows

To add a new flow:

1. Create a new service that extends `WhatsAppBaseFlowService`.
2. Implement the `handleFlowRequest` method.
3. Add the service to the `WhatsAppFlowsModule` providers and exports.
4. Add a new endpoint in the `WhatsAppFlowsController`.

## Testing

To test the flows:

1. Use the WhatsApp Business API to send messages to your webhook.
2. Monitor the logs for any errors or unexpected behavior.
3. Verify that the user account is created correctly in the database.

## Future Improvements

1. Add support for more complex flows.
2. Implement a flow builder interface for non-technical users.
3. Add analytics to track flow completion rates.
4. Implement A/B testing for different flow variations.
