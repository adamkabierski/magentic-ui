import { 
  BaseAgent, 
  AgentMessage, 
  AgentResponse, 
  SchemaExpertAgent, 
  OrchestratorAgent 
} from "./agents";

export class AgentTeam {
  private orchestrator: OrchestratorAgent;
  private agents: Map<string, BaseAgent>;
  private conversationMemory: Map<string, AgentMessage[]>;

  constructor(apiKey: string) {
    this.orchestrator = new OrchestratorAgent(apiKey);
    this.agents = new Map([
      ["schema_expert", new SchemaExpertAgent(apiKey)]
    ]);
    this.conversationMemory = new Map();
  }

  async processMessage(message: string, conversationId: string): Promise<string> {
    // Get conversation history
    const history = this.conversationMemory.get(conversationId) || [];
    
    // Step 1: Orchestrator determines which agent to use
    const orchestratorResponse = await this.orchestrator.processMessage(message, history);
    
    if (!orchestratorResponse.shouldContinue || !orchestratorResponse.nextAgent) {
      // Orchestrator handled the query directly (shouldn't happen normally)
      this.updateConversationMemory(conversationId, message, orchestratorResponse.content);
      return orchestratorResponse.content;
    }

    // Step 2: Route to the selected agent
    const targetAgentName = orchestratorResponse.nextAgent;
    const targetAgent = this.agents.get(targetAgentName);
    
    if (!targetAgent) {
      const errorMsg = `Agent ${targetAgentName} not found. Using schema expert as fallback.`;
      const fallbackAgent = this.agents.get("schema_expert")!;
      const response = await fallbackAgent.processMessage(message, history);
      this.updateConversationMemory(conversationId, message, response.content);
      return response.content;
    }

    // Step 3: Execute with the target agent
    const agentResponse = await targetAgent.processMessage(message, history);
    
    // Step 4: Update conversation memory
    this.updateConversationMemory(conversationId, message, agentResponse.content, targetAgentName);
    
    return agentResponse.content;
  }

  private updateConversationMemory(
    conversationId: string, 
    userMessage: string, 
    assistantMessage: string,
    agentName?: string
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
      agentName,
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

  // For debugging - get agent info
  getAgentInfo(): { [key: string]: string } {
    const info: { [key: string]: string } = {};
    info["orchestrator"] = this.orchestrator.getDescription();
    
    for (const [name, agent] of this.agents) {
      info[name] = agent.getDescription();
    }
    
    return info;
  }
} 