import OpenAI from 'openai';
import { AECSchema, ChatMessage } from './types';
import aecSchema from './aec-schema.json';

const openai = new OpenAI({
  apiKey: 'your-api-key-here' // Replace with actual key
});

export class AECAssistant {
  private schema: AECSchema;
  private conversationMemory: Map<string, ChatMessage[]>;

  constructor() {
    this.schema = aecSchema as AECSchema;
    this.conversationMemory = new Map();
  }

  async processMessage(message: string, conversationId: string): Promise<string> {
    // Get conversation history
    const history = this.conversationMemory.get(conversationId) || [];
    
    // Build context from schema
    const schemaContext = this.buildSchemaContext();
    
    // Create system prompt
    const systemPrompt = `You are an AI assistant specialized in AEC (Architecture, Engineering, Construction) applications.
You help users understand and work with a construction management web application.

Application Structure:
${schemaContext}

Your role:
- Help users understand how different parts of the application work together
- Explain workflows and relationships between components
- Provide guidance on using specific features
- Answer questions about construction management processes
- Be concise and practical in your responses

User's message context: The user is working with a construction management application and may ask about:
- How to use specific features (3D viewer, Gantt charts, etc.)
- Understanding relationships between elements
- Workflow guidance
- Troubleshooting unexpected behavior

Respond conversationally and helpfully.`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.map(msg => ({ role: msg.role, content: msg.content })),
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      const response = completion.choices[0]?.message?.content || 'Sorry, I could not process your request.';
      
      // Update conversation memory
      this.updateConversationMemory(conversationId, message, response);
      
      return response;
    } catch (error) {
      console.error('OpenAI API error:', error);
      return 'I apologize, but I encountered an error processing your request. Please try again.';
    }
  }

  private buildSchemaContext(): string {
    const nodesList = this.schema.nodes.map(node => 
      `- ${node.name}: ${node.description}`
    ).join('\n');

    const relationshipsList = this.schema.relationships.map(rel => 
      `- ${rel.description}`
    ).join('\n');

    const workflowsList = this.schema.workflows.map(workflow => 
      `- ${workflow.name}: ${workflow.description}`
    ).join('\n');

    return `Components:
${nodesList}

Key Relationships:
${relationshipsList}

Common Workflows:
${workflowsList}`;
  }

  private updateConversationMemory(conversationId: string, userMessage: string, assistantMessage: string): void {
    const history = this.conversationMemory.get(conversationId) || [];
    
    history.push({
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    });
    
    history.push({
      role: 'assistant',
      content: assistantMessage,
      timestamp: Date.now()
    });

    // Keep only last 10 messages to avoid token limits
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }

    this.conversationMemory.set(conversationId, history);
  }

  generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 