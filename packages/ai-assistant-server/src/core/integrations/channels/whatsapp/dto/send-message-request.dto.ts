export interface InteractiveFlowContent {
  type: 'flow';
  body: {
    text: string;
  };
  action: {
    name: 'flow';
    parameters: {
      flow_id: string;
      flow_token: string;
      flow_message_version: string;
      flow_cta: string;
      flow_action: string;
      mode: string;
      flow_action_payload: {
        screen: string;
        data: Record<string, any>;
      };
    };
  };
}
