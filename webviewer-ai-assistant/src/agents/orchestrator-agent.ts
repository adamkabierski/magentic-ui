import OpenAI from "openai";
import { BaseAgent, AgentMessage, AgentResponse } from "./base-agent";

export class OrchestratorAgent extends BaseAgent {
  private openai: OpenAI;
  private availableAgents: Map<string, string>;

  constructor(apiKey: string) {
    super(
      "orchestrator",
      "Main orchestrator agent that routes user queries to appropriate specialized agents based on intent analysis."
    );
    
    this.openai = new OpenAI({ apiKey });
    this.availableAgents = new Map([
      ["schema_expert", "Expert on XYZ Reality's WebViewer application components, workflows, and relationships. Handles questions about features, navigation, linking, status tracking."]
    ]);
  }

  async processMessage(
    message: string,
    conversationHistory: AgentMessage[]
  ): Promise<AgentResponse> {
    
    const agentList = Array.from(this.availableAgents.entries())
      .map(([name, desc]) => `${name}: ${desc}`)
      .join('\n');

    const systemPrompt = `You are the OrchestratorAgent for XYZ Reality's WebViewer application.

ROLE: Analyze user queries and route them to the most appropriate agent.

AVAILABLE AGENTS:
${agentList}

USER QUERY ANALYSIS:
- If user asks about WebViewer features, components, workflows, linking, context menus, or any application functionality → route to "schema_expert"
- The schema_expert handles ALL WebViewer application questions

RESPONSE FORMAT:
Respond with ONLY the agent name that should handle this query: "schema_expert"

Do not provide explanations, just the agent name.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Route this query: "${message}"` },
        ],
        max_tokens: 50,
        temperature: 0.1,
      });

      const selectedAgent = completion.choices[0]?.message?.content?.trim() || "schema_expert";
      
      // For now, always route to schema_expert since it's our main agent
      const targetAgent = this.availableAgents.has(selectedAgent) ? selectedAgent : "schema_expert";

      return this.createResponse(
        `Routing to ${targetAgent}`,
        true,
        targetAgent
      );
      
    } catch (error) {
      console.error("OrchestratorAgent error:", error);
      // Default to schema expert on error
      return this.createResponse(
        "Routing to schema_expert",
        true,
        "schema_expert"
      );
    }
  }
} 