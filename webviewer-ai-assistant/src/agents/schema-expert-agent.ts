import OpenAI from "openai";
import { BaseAgent, AgentMessage, AgentResponse } from "./base-agent";
import { AECSchema } from "../types";
import aecSchema from "../aec-schema.json";

export class SchemaExpertAgent extends BaseAgent {
  private schema: AECSchema;
  private openai: OpenAI;

  constructor(apiKey: string) {
    super(
      "schema_expert",
      "Expert agent for XYZ Reality's WebViewer application. Provides expert answers using pre-analyzed relevant schema information."
    );
    
    this.schema = aecSchema as AECSchema;
    this.openai = new OpenAI({ apiKey });
  }

  async processMessage(
    message: string,
    conversationHistory: AgentMessage[],
    relevantSchemaInfo?: string
  ): Promise<AgentResponse> {
    
    console.log(`🎯 SchemaExpertAgent processing: "${message}"`);
    console.log(`📋 Received schema info: ${relevantSchemaInfo ? relevantSchemaInfo.substring(0, 200) + '...' : 'None - using full schema'}`);
    
    // Use relevant schema info if provided by SchemaAnalystAgent, otherwise fall back to full schema
    const schemaContext = relevantSchemaInfo || this.buildFullSchemaContext();
    
    const systemPrompt = `🚨 CRITICAL: You are the SchemaExpertAgent for XYZ Reality's WebViewer application.

WHO YOU ARE:
You are THE expert on this construction management application. You know every component, workflow, and relationship.

STRICT RULES (VIOLATION = FAILURE):
1. ONLY use information from the schema below
2. If NOT in schema → "I don't have that information in my knowledge base"
3. Use EXACT terminology from schema
4. Be concise and expert-level
5. The schema information below has been pre-analyzed for relevance to this specific query

RELEVANT SCHEMA INFORMATION:
${schemaContext}

Your expertise: WebViewer components, linking workflows, context menus, installation status tracking.
Respond as the definitive expert with the most relevant information.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory
            .slice(-6) // Keep last 6 messages for context
            .map((msg) => ({ role: msg.role, content: msg.content })),
          { role: "user", content: message },
        ],
        max_tokens: 300,
        temperature: 0.0,
      });

      const response = completion.choices[0]?.message?.content || 
        "I apologize, but I encountered an error processing your request.";

      console.log(`💬 SchemaExpertAgent response: ${response}`);

      // Schema expert is terminal - doesn't delegate to other agents
      return this.createResponse(response, false);
      
    } catch (error) {
      console.error("SchemaExpertAgent error:", error);
      return this.createResponse(
        "I apologize, but I encountered an error processing your request. Please try again.",
        false
      );
    }
  }

  private buildFullSchemaContext(): string {
    const nodes = this.schema.mainPipeline.nodes;
    const edges = this.schema.mainPipeline.edges;

    let context = "COMPONENTS:\n";
    
    nodes.forEach((node) => {
      context += `${node.data.label}: ${node.data.description}\n`;
    });
    
    context += "\nCONNECTIONS:\n";
    
    edges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (sourceNode && targetNode) {
        context += `${sourceNode.data.label} → ${targetNode.data.label}: ${edge.data.connection}\n`;
      }
    });

    return context;
  }
} 