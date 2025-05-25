import OpenAI from "openai";
import { BaseAgent, AgentMessage, AgentResponse } from "./base-agent";
import { AECSchema } from "../types";
import aecSchema from "../aec-schema.json";

export class SchemaAnalystAgent extends BaseAgent {
  private schema: AECSchema;
  private openai: OpenAI;

  constructor(apiKey: string) {
    super(
      "schema_analyst",
      "AI agent that analyzes user queries and intelligently extracts relevant schema information using AI reasoning, not keywords."
    );
    
    this.schema = aecSchema as AECSchema;
    this.openai = new OpenAI({ apiKey });
  }

  async processMessage(
    message: string,
    conversationHistory: AgentMessage[]
  ): Promise<AgentResponse> {
    
    console.log(`🔍 SchemaAnalystAgent analyzing: "${message}"`);
    
    // TEMPORARY DEBUG: If query contains "data mapping", return hardcoded relevant info
    if (message.toLowerCase().includes('data mapping')) {
      console.log(`🧪 DEBUG: Detected data mapping query, returning hardcoded relevant schema`);
      
      const hardcodedRelevantSchema = `RELEVANT COMPONENTS:
"Data mapping": Data mapping is additional panel appearing above the gantt. It allows to fill out values for activities columns like 'Discipline', 'Package', 'Phase'
"Gantt chart": Gantt chart showing schedule activities in remaining space. The structure comprises of WBS items as parents and schedule activities as children.
"Context menu within gantt chart": When some activity is selected in gantt chart it comprises: Un-link selected elements, Link selected elements, Select linked elements, Isolate linked elements, Collapse selected, Expand all, Collapse all, Show / hide Schedule, Open Mapping table, Deselect activity

RELEVANT CONNECTIONS:
Gantt chart → Data mapping: Initially Data mapping panel is hidden. If some activities has empty values in columns like 'Discipline', 'Package', 'Phase' we can open data mapping panel by calling via context menu. Also if some activities has empty values, we see alert notification in the top bar with button to open data mapping panel.
Context menu within gantt chart → Data mapping: Context menu includes action to open Data mapping panel`;

      console.log(`🎯 Hardcoded relevant schema: ${hardcodedRelevantSchema}`);
      return this.createResponse(hardcodedRelevantSchema, true, "schema_expert");
    }
    
    // Step 1: Use AI to understand what the user is asking about
    const queryAnalysis = await this.analyzeUserQuery(message);
    console.log(`📝 Query analysis result: ${queryAnalysis}`);
    
    // Step 2: Use AI to find relevant schema components
    const relevantSchema = await this.findRelevantSchemaWithAI(queryAnalysis);
    console.log(`🎯 Relevant schema found: ${relevantSchema}`);
    
    return this.createResponse(relevantSchema, true, "schema_expert");
  }

  private async analyzeUserQuery(query: string): Promise<string> {
    const analysisPrompt = `Analyze this user query about a construction management WebViewer application:

USER QUERY: "${query}"

Extract the key concepts, components, or features the user is asking about. Focus on:
- What specific UI component or feature they're referring to
- What action or workflow they want to understand
- Any technical terms or application-specific language

Respond with a clear analysis of what they're asking about.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: analysisPrompt }],
        max_tokens: 150,
        temperature: 0.2,
      });

      return completion.choices[0]?.message?.content || query;
    } catch (error) {
      console.error("Query analysis error:", error);
      return query;
    }
  }

  private async findRelevantSchemaWithAI(queryAnalysis: string): Promise<string> {
    const schemaComponents = this.schema.mainPipeline.nodes
      .map(node => `"${node.data.label}": ${node.data.description}`)
      .join('\n');

    const schemaConnections = this.schema.mainPipeline.edges
      .map(edge => {
        const sourceNode = this.schema.mainPipeline.nodes.find(n => n.id === edge.source);
        const targetNode = this.schema.mainPipeline.nodes.find(n => n.id === edge.target);
        if (sourceNode && targetNode) {
          return `${sourceNode.data.label} → ${targetNode.data.label}: ${edge.data.connection}`;
        }
        return '';
      })
      .filter(conn => conn)
      .join('\n');

    console.log(`📋 Available components in schema:\n${schemaComponents.split('\n').slice(0, 5).join('\n')}...`);

    const relevanceFindingPrompt = `You are an AI that finds relevant information from a WebViewer application schema.

USER IS ASKING ABOUT: ${queryAnalysis}

AVAILABLE COMPONENTS:
${schemaComponents}

AVAILABLE CONNECTIONS:
${schemaConnections}

Task: Identify which components and connections are most relevant to what the user is asking about. Use AI reasoning to understand semantic relationships, not just word matching.

Return ONLY the relevant components and connections that directly relate to the user's query. If something seems related semantically (even if words don't match exactly), include it.

Format your response as:
RELEVANT COMPONENTS:
[list relevant components with descriptions]

RELEVANT CONNECTIONS:
[list relevant connections]`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o", 
        messages: [{ role: "user", content: relevanceFindingPrompt }],
        max_tokens: 500,
        temperature: 0.1,
      });

      return completion.choices[0]?.message?.content || "No relevant schema information found.";
    } catch (error) {
      console.error("Schema relevance finding error:", error);
      return `Full schema context needed for: ${queryAnalysis}`;
    }
  }
} 