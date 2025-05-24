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
  name: string;
  type: string;
  description: string;
  properties: string[];
}

export interface AECRelationship {
  from: string;
  to: string;
  type: string;
  description: string;
}

export interface AECWorkflow {
  name: string;
  description: string;
  steps: string[];
}

export interface AECSchema {
  nodes: AECNode[];
  relationships: AECRelationship[];
  workflows: AECWorkflow[];
} 