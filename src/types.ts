export type MessageRole = 'user' | 'model' | 'system';

export interface MessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  parts: MessagePart[];
  timestamp: number;
}

export interface ProjectDesignState {
  currentQuestion: number;
  answers: Record<number, string>;
  isComplete: boolean;
}
