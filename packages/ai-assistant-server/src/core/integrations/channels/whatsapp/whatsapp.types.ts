/**
 * WhatsApp Cloud API Types
 */

// WhatsApp Message Template
export interface WhatsAppMessageTemplate {
  name: string;
  language: {
    code: string;
  };
  components?: Array<{
    type: string;
    parameters: Array<{
      type: string;
      text?: string;
      image?: {
        link: string;
      };
      document?: {
        link: string;
      };
      video?: {
        link: string;
      };
      currency?: {
        fallback_value: string;
        code: string;
        amount_1000: number;
      };
      date_time?: {
        fallback_value: string;
      };
    }>;
  }>;
}

// WhatsApp Text Message
export interface WhatsAppTextMessage {
  messaging_product: string;
  recipient_type: string;
  to: string;
  type: string;
  text: {
    preview_url?: boolean;
    body: string;
  };
}

// WhatsApp Media Message
export interface WhatsAppMediaMessage {
  messaging_product: string;
  recipient_type: string;
  to: string;
  type: string;
  [mediaType: string]: any;
}

// WhatsApp Reaction Message
export interface WhatsAppReactionMessage {
  messaging_product: string;
  recipient_type: string;
  to: string;
  type: 'reaction';
  reaction: {
    message_id: string;
    emoji: string;
  };
}

// WhatsApp Interactive Message
export interface WhatsAppInteractiveMessage {
  messaging_product: string;
  recipient_type: string;
  to: string;
  type: 'interactive';
  interactive: {
    type: 'button' | 'list' | 'product' | 'product_list';
    header?: {
      type: 'text' | 'image' | 'video' | 'document';
      text?: string;
      image?: { link: string };
      video?: { link: string };
      document?: { link: string };
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: {
      buttons?: Array<{
        type: 'reply';
        reply: {
          id: string;
          title: string;
        };
      }>;
      sections?: Array<{
        title?: string;
        rows: Array<{
          id: string;
          title: string;
          description?: string;
        }>;
      }>;
    };
  };
}

// WhatsApp Contact Message
export interface WhatsAppContactMessage {
  messaging_product: string;
  recipient_type: string;
  to: string;
  type: 'contacts';
  contacts: Array<{
    name: {
      formatted_name: string;
      first_name?: string;
      last_name?: string;
      middle_name?: string;
      suffix?: string;
      prefix?: string;
    };
    phones?: Array<{
      phone: string;
      type: string;
      wa_id?: string;
    }>;
    emails?: Array<{
      email: string;
      type: string;
    }>;
    addresses?: Array<{
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
      country_code?: string;
      type: string;
    }>;
    urls?: Array<{
      url: string;
      type: string;
    }>;
    birthday?: string;
    org?: {
      company?: string;
      department?: string;
      title?: string;
    };
  }>;
}

// WhatsApp Sticker Message
export interface WhatsAppStickerMessage {
  messaging_product: string;
  recipient_type: string;
  to: string;
  type: 'sticker';
  sticker: {
    link: string;
    id?: string;
  };
}

// WhatsApp Webhook Event
export interface WhatsAppWebhookEvent {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: WhatsAppWebhookMessage[];
        statuses?: WhatsAppMessageStatus[];
      };
      field: string;
    }>;
  }>;
}

// WhatsApp Webhook Message
export interface WhatsAppWebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: {
    body: string;
  };
  image?: {
    caption?: string;
    mime_type: string;
    sha256: string;
    id: string;
  };
  audio?: {
    mime_type: string;
    sha256: string;
    id: string;
    voice: boolean;
  };
  video?: {
    caption?: string;
    mime_type: string;
    sha256: string;
    id: string;
  };
  document?: {
    caption?: string;
    filename: string;
    mime_type: string;
    sha256: string;
    id: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  button?: {
    text: string;
    payload: string;
  };
  interactive?: {
    type: string;
    button_reply?: {
      id: string;
      title: string;
    };
    list_reply?: {
      id: string;
      title: string;
      description?: string;
    };
  };
  context?: {
    from: string;
    id: string;
  };
  reaction?: {
    message_id: string;
    emoji: string;
  };
  sticker?: {
    mime_type: string;
    sha256: string;
    id: string;
    animated: boolean;
  };
  contacts?: Array<{
    name: {
      formatted_name: string;
      first_name?: string;
      last_name?: string;
      middle_name?: string;
      suffix?: string;
      prefix?: string;
    };
    phones?: Array<{
      phone: string;
      type: string;
      wa_id?: string;
    }>;
    emails?: Array<{
      email: string;
      type: string;
    }>;
    addresses?: Array<{
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
      country_code?: string;
      type: string;
    }>;
    urls?: Array<{
      url: string;
      type: string;
    }>;
    birthday?: string;
    org?: {
      company?: string;
      department?: string;
      title?: string;
    };
  }>;
}

// WhatsApp Message Status
export interface WhatsAppMessageStatus {
  id: string;
  recipient_id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  conversation: {
    id: string;
    origin: {
      type: string;
    };
  };
  pricing: {
    billable: boolean;
    pricing_model: string;
    category: string;
  };
  errors?: Array<{
    code: number;
    title: string;
  }>;
}

// WhatsApp Media URL Response
export interface WhatsAppMediaUrlResponse {
  url: string;
  mime_type: string;
  sha256: string;
  file_size: number;
  id: string;
  messaging_product: string;
}

export interface EncryptedFlowRequest {
  encrypted_aes_key: string;
  encrypted_flow_data: string;
  initial_vector: string;
}

export interface DecryptedFlowRequest {
  screen: string;
  data: Record<string, any>;
  version: string;
  action: string;
  flow_token: string;
}

export type FlowResponse =
  | FlowPingResponse
  | FlowInitResponse
  | FlowDataExchangeSuccessResponse
  | FlowErrorResponse;

export interface FlowPingResponse {
  version: string;
  data: {
    status: 'active';
  };
}

export interface FlowErrorResponse {
  version: string;
  data: {};
}

export interface FlowInitResponse {
  version: string;
  screen: string;
  data?: Record<string, string>;
}

export interface FlowDataExchangeResponse {
  version: string;
  screen: string;
  data: Record<string, any>;
}

export interface FlowDataExchangeSuccessResponse {
  version: string;
  screen: 'SUCCESS';
  data: {
    extension_message_response: {
      params: {
        flow_token: string;
        response: string;
      };
    };
  };
}

export interface FlowInfo {
  id: string;
  name: string;
  version: string;
  status: string;
}

export interface ListFlowsResponse {
  data: Array<{
    id: string;
    name: string;
    status: string;
    categories: string[];
  }>;
}
