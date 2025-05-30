export interface DecryptedFlowRequest {
  screen: string;
  data: Record<string, any>;
  version: string;
  action: string;
  flow_token: string;
}
