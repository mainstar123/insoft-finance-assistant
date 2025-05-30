# WhatsApp Cloud API Integration

This module provides integration with the WhatsApp Cloud API for the Tamy Finance Assistant. It allows the assistant to send and receive messages through WhatsApp.

## Features

- **Webhook Handling**: Processes incoming webhook events from WhatsApp
- **Message Sending**: Sends text, media, template, interactive, sticker, and contact messages
- **Message Receiving**: Handles text, media, interactive, sticker, contact, and reaction messages
- **Rate Limiting**: Implements rate limiting to comply with WhatsApp's API limits
- **Message Queuing**: Queues messages to ensure reliable delivery
- **Error Handling**: Comprehensive error handling for all API interactions
- **Media Support**: Handles various media types (images, audio, video, documents, stickers)
- **Interactive Messages**: Supports buttons and list messages
- **Advanced Templates**: Enhanced support for templates with dynamic variables

## Setup

### Prerequisites

1. A Meta Developer account
2. A WhatsApp Business Account
3. A registered WhatsApp Business API phone number
4. An app with the WhatsApp API enabled

### Configuration

Add the following environment variables to your `.env` file:

```
# WhatsApp Cloud API Configuration
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_API_KEY=your_access_token
WHATSAPP_API_VERSION=v18.0
WHATSAPP_VERIFY_TOKEN=your_verify_token
WHATSAPP_APP_SECRET=your_app_secret

# Optional Configuration
WHATSAPP_VERIFY_SIGNATURE=true
WHATSAPP_ENABLE_READ_RECEIPTS=true
WHATSAPP_LOG_WEBHOOK_EVENTS=false
WHATSAPP_ENABLE_MESSAGE_QUEUE=true
WHATSAPP_MESSAGE_QUEUE_SIZE=100
WHATSAPP_MESSAGE_RATE_LIMIT=30
WHATSAPP_MESSAGE_RATE_LIMIT_PERIOD=60000
WHATSAPP_REQUEST_TIMEOUT=10000
```

### Webhook Setup

1. Set up a webhook URL in your Meta Developer account:
   - URL: `https://your-domain.com/webhooks/whatsapp`
   - Verify Token: The same value as `WHATSAPP_VERIFY_TOKEN`
   - Subscribe to the following fields:
     - `messages`
     - `message_status`

2. Ensure your server is accessible from the internet and can receive webhook events.

## Usage

### Sending Messages

#### Text Messages

```typescript
// Inject the ChannelService
constructor(private readonly channelService: ChannelService) {}

// Send a text message
await this.channelService.sendMessage({
  channelId: 'whatsapp',
  userId: 'phone_number', // Format: country code + number, e.g., '15551234567'
  content: 'Hello from Tamy Finance Assistant!',
});
```

#### Media Messages

```typescript
// Send a message with an image attachment
await this.channelService.sendMessage({
  channelId: 'whatsapp',
  userId: 'phone_number',
  content: 'Check out this image:',
  attachments: [
    {
      type: 'image',
      url: 'https://example.com/image.jpg',
      metadata: {
        caption: 'An example image',
      },
    },
  ],
});

// Send a document
await this.channelService.sendMessage({
  channelId: 'whatsapp',
  userId: 'phone_number',
  content: 'Here is the document you requested:',
  attachments: [
    {
      type: 'document',
      url: 'https://example.com/document.pdf',
      metadata: {
        caption: 'Important document',
      },
    },
  ],
});

// Send a sticker
await this.channelService.sendMessage({
  channelId: 'whatsapp',
  userId: 'phone_number',
  attachments: [
    {
      type: 'sticker',
      url: 'https://example.com/sticker.webp',
    },
  ],
});
```

#### Interactive Messages

```typescript
// Inject the WhatsAppChannel directly for specialized message types
constructor(private readonly whatsAppChannel: WhatsAppChannel) {}

// Send a button message
await this.whatsAppChannel.sendButtonMessage(
  'phone_number',
  'Please select an option:',
  [
    { id: 'btn1', title: 'Option 1' },
    { id: 'btn2', title: 'Option 2' },
    { id: 'btn3', title: 'Option 3' },
  ]
);

// Send a list message
await this.whatsAppChannel.sendListMessage(
  'phone_number',
  'Please select a category:',
  'View Categories',
  [
    {
      title: 'Food',
      rows: [
        { id: 'food1', title: 'Breakfast', description: 'Morning meals' },
        { id: 'food2', title: 'Lunch', description: 'Midday meals' },
        { id: 'food3', title: 'Dinner', description: 'Evening meals' },
      ],
    },
    {
      title: 'Drinks',
      rows: [
        { id: 'drink1', title: 'Coffee', description: 'Hot beverages' },
        { id: 'drink2', title: 'Juice', description: 'Cold beverages' },
      ],
    },
  ]
);
```

#### Contact Messages

```typescript
// Send a contact message
await this.whatsAppChannel.sendContactMessage(
  'phone_number',
  [
    {
      name: {
        formatted_name: 'John Doe',
        first_name: 'John',
        last_name: 'Doe',
      },
      phones: [
        {
          phone: '+1234567890',
          type: 'CELL',
        },
      ],
      emails: [
        {
          email: 'john.doe@example.com',
          type: 'WORK',
        },
      ],
    },
  ]
);
```

#### Reactions

```typescript
// Send a reaction to a message
await this.whatsAppChannel.sendReaction(
  'phone_number',
  'message_id_to_react_to',
  '👍'
);
```

#### Template Messages

```typescript
// Send a simple template message
await this.whatsAppChannel.sendTemplateMessage(
  'phone_number',
  'template_name',
  'en_US'
);

// Send a template message with dynamic variables
const headerComponent = this.whatsAppService.createHeaderComponent(
  'text',
  'Your Monthly Report'
);

const bodyComponent = this.whatsAppService.createBodyComponent([
  'John Doe',
  { currency_code: 'USD', amount_1000: 125000 }, // $125.00
  new Date(),
]);

const buttonComponent = this.whatsAppService.createButtonComponent([
  { id: 'btn1', text: 'View Details' },
  { id: 'btn2', text: 'Download Report' },
]);

await this.whatsAppChannel.sendTemplateMessage(
  'phone_number',
  'monthly_report',
  'en_US',
  [headerComponent, bodyComponent, buttonComponent] as any
);
```

### Receiving Messages

Messages are automatically processed by the WhatsApp channel and forwarded to the AI Orchestrator. The following message types are supported:

- Text messages
- Image messages (with captions)
- Audio messages
- Video messages (with captions)
- Document messages (with captions)
- Location messages
- Button responses
- List responses
- Sticker messages
- Contact messages
- Reaction messages

## Best Practices

1. **Rate Limiting**: WhatsApp has rate limits for sending messages. The integration includes rate limiting, but be mindful of these limits.

2. **Message Templates**: For sending proactive messages, use WhatsApp message templates that have been approved by Meta.

3. **Error Handling**: Always handle errors when sending messages, as the WhatsApp API may return errors for various reasons.

4. **Media Messages**: When sending media, ensure the media URL is publicly accessible and the file size is within WhatsApp's limits.

5. **Message Formatting**: Use WhatsApp's supported formatting (bold, italic, strikethrough, monospace) for better readability.

6. **Interactive Messages**: Use buttons and lists for better user experience when appropriate.

7. **Testing**: Test your integration thoroughly with different message types and edge cases.

## Troubleshooting

### Common Issues

1. **Webhook Verification Fails**:
   - Ensure the verify token matches the one in your Meta Developer account
   - Check that your server is accessible from the internet

2. **Messages Not Being Received**:
   - Verify that your webhook is properly configured
   - Check the logs for any errors in processing webhook events

3. **Messages Not Being Sent**:
   - Verify that your access token is valid
   - Check that the phone number ID is correct
   - Ensure the recipient's phone number is in the correct format

4. **Media Messages Fail**:
   - Ensure the media URL is publicly accessible
   - Check that the file size is within WhatsApp's limits
   - Verify that the media type is supported

### Debugging

Enable debug logging to see more detailed information about the WhatsApp integration:

```
# In your .env file
LOG_LEVEL=debug
WHATSAPP_LOG_WEBHOOK_EVENTS=true
```

## Resources

- [WhatsApp Cloud API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [WhatsApp Business Platform](https://business.whatsapp.com/)
- [Meta for Developers](https://developers.facebook.com/)
