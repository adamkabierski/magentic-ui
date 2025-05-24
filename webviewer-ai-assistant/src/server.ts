import express from 'express';
import cors from 'cors';
import { ChatRequest, ChatResponse } from './types';
import { AgentTeam } from './agent-team';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Agent Team (like Magentic-UI's task team)
const agentTeam = new AgentTeam(process.env.OPENAI_API_KEY || "your-api-key");

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Agent info endpoint (for debugging)
app.get('/agents', (req, res) => {
  res.json(agentTeam.getAgentInfo());
});

// Chat endpoint (now using agent orchestration)
app.post('/chat', async (req, res) => {
  try {
    const { message, conversationId }: ChatRequest = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Generate conversation ID if not provided
    const currentConversationId = conversationId || agentTeam.generateConversationId();

    // Process message through agent team (orchestrator + specialists)
    const response = await agentTeam.processMessage(message.trim(), currentConversationId);

    const chatResponse: ChatResponse = {
      message: response,
      conversationId: currentConversationId
    };

    res.json(chatResponse);
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 WebViewer AI Assistant (Agent Team) running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Agent info: http://localhost:${port}/agents`);
  console.log(`Chat endpoint: POST http://localhost:${port}/chat`);
});

export default app; 