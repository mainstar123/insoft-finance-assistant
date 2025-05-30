export interface IChatSession {
  id: number;
  userId: number;
  startedAt: Date;
  status: string;
  messages?: IChatMessage[];
}

export interface IChatMessage {
  id: number;
  sessionId: number;
  sender: string;
  message: string;
  timestamp: Date;
}
