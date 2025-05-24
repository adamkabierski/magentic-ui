export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  agentName?: string;
}

export interface AgentResponse {
  content: string;
  shouldContinue: boolean;
  nextAgent?: string;
}

export abstract class BaseAgent {
  protected name: string;
  protected description: string;

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  abstract processMessage(
    message: string,
    conversationHistory: AgentMessage[]
  ): Promise<AgentResponse>;

  protected createResponse(
    content: string,
    shouldContinue: boolean = false,
    nextAgent?: string
  ): AgentResponse {
    return {
      content,
      shouldContinue,
      nextAgent,
    };
  }
} 