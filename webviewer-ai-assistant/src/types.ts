export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
}

export interface AECNode {
  id: string;
  type: string;
  levelOfPriority: number;
  data: {
    label: string;
    description: string;
  };
}

export interface AECEdge {
  id: string;
  source: string;
  target: string;
  data: {
    connection: string;
  };
}

export interface AECSchema {
  mainPipeline: {
    nodes: AECNode[];
    edges: AECEdge[];
  };
} 