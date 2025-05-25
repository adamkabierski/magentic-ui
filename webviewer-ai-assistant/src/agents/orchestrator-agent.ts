import OpenAI from "openai";
import { BaseAgent, AgentMessage, AgentResponse } from "./base-agent";
import { SchemaExpertAgent } from "./schema-expert-agent";
import { SchemaAnalystAgent } from "./schema-analyst-agent";

export class OrchestratorAgent extends BaseAgent {
  private openai: OpenAI;
  private schemaAnalyst: SchemaAnalystAgent;
  private schemaExpert: SchemaExpertAgent;

  constructor(apiKey: string) {
    super(
      "orchestrator",
      "Main orchestrator that coordinates between schema analysis and expert response generation using AI-driven routing."
    );
    
    this.openai = new OpenAI({ apiKey });
    this.schemaAnalyst = new SchemaAnalystAgent(apiKey);
    this.schemaExpert = new SchemaExpertAgent(apiKey);
  }

  async processMessage(
    message: string,
    conversationHistory: AgentMessage[]
  ): Promise<AgentResponse> {
    
    try {
      // Step 1: Let SchemaAnalystAgent find relevant schema information using AI
      const analysisResponse = await this.schemaAnalyst.processMessage(message, conversationHistory);
      
      // Step 2: Use SchemaExpertAgent with the pre-analyzed relevant schema info
      const expertResponse = await this.schemaExpert.processMessage(
        message, 
        conversationHistory,
        analysisResponse.content
      );
      
      return expertResponse;
      
    } catch (error) {
      console.error("OrchestratorAgent error:", error);
      
      // Fallback: Use SchemaExpertAgent directly if analysis fails
      return await this.schemaExpert.processMessage(message, conversationHistory);
    }
  }
} 