import express from 'express';
import cors from 'cors';
import { ChatRequest, ChatResponse } from './types';
import { AECAssistant } from './ai-agent';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize AI assistant
const assistant = new AECAssistant();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { message, conversationId }: ChatRequest = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Generate conversation ID if not provided
    const currentConversationId = conversationId || assistant.generateConversationId();

    // Process message with AI
    const response = await assistant.processMessage(message.trim(), currentConversationId);

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
  console.log(`AEC AI Assistant running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Chat endpoint: POST http://localhost:${port}/chat`);
});

export default app; 