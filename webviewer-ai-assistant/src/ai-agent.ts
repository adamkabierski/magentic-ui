import OpenAI from "openai";
import { AECSchema, ChatMessage } from "./types";
import aecSchema from "./aec-schema.json";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AECAssistant {
  private schema: AECSchema;
  private conversationMemory: Map<string, ChatMessage[]>;

  constructor() {
    this.schema = aecSchema as AECSchema;
    this.conversationMemory = new Map();
  }

  async processMessage(
    message: string,
    conversationId: string
  ): Promise<string> {
    // Get conversation history
    const history = this.conversationMemory.get(conversationId) || [];

    // Build context from schema
    const schemaContext = this.buildSchemaContext();

    // Create system prompt
    const systemPrompt = `🚨 CRITICAL: You are ONLY allowed to use information from the schema below. DO NOT add, assume, or invent anything.

WHO YOU ARE:
You are the official AI assistant for XYZ Reality's WebViewer application. You are an expert who has mastered this construction management software completely.

WHAT YOU'RE ACCOUNTABLE FOR:
- Providing accurate guidance to users working with the WebViewer application
- Helping users understand how to use specific features and workflows
- Explaining relationships between different components (3D viewer, Gantt chart, etc.)
- Guiding users through linking processes and status tracking
- Troubleshooting when users can't find or use features
- Being the reliable expert that users can depend on for WebViewer questions

STRICT RULES (VIOLATION = FAILURE):
1. If information is NOT in the schema → say "I don't have that information in my knowledge base"
2. NEVER mention features, buttons, or workflows not explicitly listed in the schema
3. Use EXACT terminology from the schema - don't paraphrase
4. Before responding, mentally check: "Is this information explicitly in my schema?"

AVAILABLE INFORMATION (SCHEMA):
${schemaContext}

RESPONSE FORMAT:
- Direct answer first
- Only use information above
- Be expert-level concise
- If unsure → "I don't have that information in my knowledge base"

You are THE expert for XYZ Reality's WebViewer. Users rely on you to know this application perfectly.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...history.map((msg) => ({ role: msg.role, content: msg.content })),
          { role: "user", content: message },
        ],
        max_tokens: 300,
        temperature: 0.1,
      });

      const response =
        completion.choices[0]?.message?.content ||
        "Sorry, I could not process your request.";

      // Update conversation memory
      this.updateConversationMemory(conversationId, message, response);

      return response;
    } catch (error) {
      console.error("OpenAI API error:", error);
      return "I apologize, but I encountered an error processing your request. Please try again.";
    }
  }

  private buildSchemaContext(): string {
    const nodes = this.schema.mainPipeline.nodes;
    const edges = this.schema.mainPipeline.edges;

    let context = "COMPONENTS:\n";
    
    // List ALL components with their exact descriptions
    nodes.forEach((node) => {
      context += `${node.data.label}: ${node.data.description}\n`;
    });
    
    context += "\nCONNECTIONS:\n";
    
    // List key relationships 
    edges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (sourceNode && targetNode) {
        context += `${sourceNode.data.label} → ${targetNode.data.label}: ${edge.data.connection}\n`;
      }
    });

    return context;
  }

  private updateConversationMemory(
    conversationId: string,
    userMessage: string,
    assistantMessage: string
  ): void {
    const history = this.conversationMemory.get(conversationId) || [];

    history.push({
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
    });

    history.push({
      role: "assistant",
      content: assistantMessage,
      timestamp: Date.now(),
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
