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
  data: {
    acknowledged: true;
  };
}

export interface FlowInitResponse {
  version: string;
  /**
   * The name of the initial screen
   */
  screen: string;

  /**
   * Custom data for the screen
   */
  data?: Record<string, any>;
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
