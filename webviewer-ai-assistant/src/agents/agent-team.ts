import { BaseAgent, AgentMessage, AgentResponse } from "./base-agent";
import { OrchestratorAgent } from "./orchestrator-agent";

export class AgentTeam {
  private orchestrator: OrchestratorAgent;
  private conversationHistory: AgentMessage[] = [];

  constructor(apiKey: string) {
    this.orchestrator = new OrchestratorAgent(apiKey);
  }

  async processMessage(userMessage: string): Promise<string> {
    // Add user message to conversation history
    this.conversationHistory.push({
      role: "user",
      content: userMessage,
      agentName: "user",
      timestamp: Date.now(),
    });

    try {
      // Use orchestrator's new two-step AI approach
      const response = await this.orchestrator.processMessage(
        userMessage,
        this.conversationHistory
      );

      // Add response to conversation history
      this.conversationHistory.push({
        role: "assistant",
        content: response.content,
        agentName: this.orchestrator.getName(),
        timestamp: Date.now(),
      });

      return response.content;
      
    } catch (error) {
      console.error("AgentTeam error:", error);
      const errorMessage = "I apologize, but I encountered an error processing your request. Please try again.";
      
      this.conversationHistory.push({
        role: "assistant", 
        content: errorMessage,
        agentName: "orchestrator",
        timestamp: Date.now(),
      });
      
      return errorMessage;
    }
  }

  getConversationHistory(): AgentMessage[] {
    return [...this.conversationHistory];
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }
} 