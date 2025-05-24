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
      "Expert agent for XYZ Reality's WebViewer application. Knows all components, workflows, and relationships from the official schema."
    );
    
    this.schema = aecSchema as AECSchema;
    this.openai = new OpenAI({ apiKey });
  }

  async processMessage(
    message: string,
    conversationHistory: AgentMessage[]
  ): Promise<AgentResponse> {
    const schemaContext = this.buildSchemaContext();
    
    const systemPrompt = `🚨 CRITICAL: You are the SchemaExpertAgent for XYZ Reality's WebViewer application.

WHO YOU ARE:
You are THE expert on this construction management application. You know every component, workflow, and relationship.

STRICT RULES (VIOLATION = FAILURE):
1. ONLY use information from the schema below
2. If NOT in schema → "I don't have that information in my knowledge base"
3. Use EXACT terminology from schema
4. Be concise and expert-level

SCHEMA KNOWLEDGE:
${schemaContext}

Your expertise: WebViewer components, linking workflows, context menus, installation status tracking.
Respond as the definitive expert.`;

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
        temperature: 0.1,
      });

      const response = completion.choices[0]?.message?.content || 
        "I apologize, but I encountered an error processing your request.";

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

  private buildSchemaContext(): string {
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