import OpenAI from "openai";
import { AECSchema, ChatMessage } from "./types";
import aecSchema from "./aec-schema.json";

const openai = new OpenAI({
  apiKey:
    "", // Replace with actual key
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
    const systemPrompt = `You are the official AI assistant for XYZ Reality's WebViewer application.
You are an EXPERT who knows this construction management application inside and out.

CRITICAL RULES:
- ONLY use information from the schema below - NEVER add anything not explicitly mentioned
- If something is not in the schema, say "I don't have that information in my knowledge base"
- Be CONCISE and DIRECT - users are busy and need quick, clear answers
- Respond like an expert who has used this app for years

The WebViewer Application (XYZ Reality):
${schemaContext}

Your expertise covers:
- Exact button locations and menu options as defined in the schema
- Precise workflows for linking elements to activities
- Specific context menu options (right-click menus)
- Installation status workflows
- Component relationships and how they sync

RESPONSE STYLE:
- Short, expert answers
- Start with the direct answer, then brief explanation if needed
- Use exact terminology from the schema
- Be confident - you know this application completely

Users expect you to know EVERYTHING about this WebViewer application.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...history.map((msg) => ({ role: msg.role, content: msg.content })),
          { role: "user", content: message },
        ],
        max_tokens: 500,
        temperature: 0.7,
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

    // Group nodes by priority level for better organization
    const coreComponents = nodes.filter((n) => n.levelOfPriority === 0);
    const primaryComponents = nodes.filter((n) => n.levelOfPriority === 1);
    const secondaryComponents = nodes.filter((n) => n.levelOfPriority === 2);
    const detailComponents = nodes.filter((n) => n.levelOfPriority === 3);

    // Build organized component list
    let context = "";

    if (coreComponents.length > 0) {
      context += "CORE WORKFLOWS:\n";
      coreComponents.forEach((node) => {
        context += `• ${node.data.label}: ${node.data.description}\n`;
      });
      context += "\n";
    }

    if (primaryComponents.length > 0) {
      context += "PRIMARY COMPONENTS:\n";
      primaryComponents.forEach((node) => {
        context += `• ${node.data.label}: ${node.data.description}\n`;
      });
      context += "\n";
    }

    if (secondaryComponents.length > 0) {
      context += "SECONDARY COMPONENTS:\n";
      secondaryComponents.forEach((node) => {
        context += `• ${node.data.label}: ${node.data.description}\n`;
      });
      context += "\n";
    }

    if (detailComponents.length > 0) {
      context += "DETAILED FEATURES:\n";
      detailComponents.forEach((node) => {
        context += `• ${node.data.label}: ${node.data.description}\n`;
      });
      context += "\n";
    }

    // Add key relationships
    context += "KEY RELATIONSHIPS:\n";
    edges.slice(0, 8).forEach((edge) => {
      // Show most important relationships
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (sourceNode && targetNode) {
        context += `• ${sourceNode.data.label} → ${targetNode.data.label}: ${edge.data.connection}\n`;
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
