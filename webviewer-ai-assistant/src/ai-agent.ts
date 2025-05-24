import OpenAI from 'openai';
import { AECSchema, ChatMessage } from './types';
import aecSchema from './aec-schema.json';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
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
    const systemPrompt = `You are an AI assistant specialized in construction management applications.
You help users understand and work with a WebViewer application for construction projects.

The WebViewer Application Structure:
${schemaContext}

Your role:
- Help users understand how different parts of the application work together
- Explain workflows and relationships between components (3D viewer, Gantt chart, model layers, etc.)
- Provide step-by-step guidance for common tasks like linking 3D elements to activities
- Answer questions about installation status tracking and progress visualization
- Help troubleshoot when features aren't working as expected
- Be practical and concise in your responses

Common user needs:
- Linking 3D building elements to Gantt chart activities
- Applying installation status to track construction progress
- Understanding how selection in one component affects others
- Using context menus and navigation features
- Filtering and searching for specific elements or activities

Respond conversationally and provide actionable guidance.`;

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
    const nodes = this.schema.mainPipeline.nodes;
    const edges = this.schema.mainPipeline.edges;

    // Group nodes by priority level for better organization
    const coreComponents = nodes.filter(n => n.levelOfPriority === 0);
    const primaryComponents = nodes.filter(n => n.levelOfPriority === 1);
    const secondaryComponents = nodes.filter(n => n.levelOfPriority === 2);
    const detailComponents = nodes.filter(n => n.levelOfPriority === 3);

    // Build organized component list
    let context = '';
    
    if (coreComponents.length > 0) {
      context += 'CORE WORKFLOWS:\n';
      coreComponents.forEach(node => {
        context += `• ${node.data.label}: ${node.data.description}\n`;
      });
      context += '\n';
    }

    if (primaryComponents.length > 0) {
      context += 'PRIMARY COMPONENTS:\n';
      primaryComponents.forEach(node => {
        context += `• ${node.data.label}: ${node.data.description}\n`;
      });
      context += '\n';
    }

    if (secondaryComponents.length > 0) {
      context += 'SECONDARY COMPONENTS:\n';
      secondaryComponents.forEach(node => {
        context += `• ${node.data.label}: ${node.data.description}\n`;
      });
      context += '\n';
    }

    // Add key relationships
    context += 'KEY RELATIONSHIPS:\n';
    edges.slice(0, 8).forEach(edge => { // Show most important relationships
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      if (sourceNode && targetNode) {
        context += `• ${sourceNode.data.label} → ${targetNode.data.label}: ${edge.data.connection}\n`;
      }
    });

    return context;
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