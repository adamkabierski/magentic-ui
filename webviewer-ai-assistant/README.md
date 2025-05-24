# AEC AI Assistant

A simple AI assistant for AEC (Architecture, Engineering, Construction) applications.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Update the OpenAI API key in `src/ai-agent.ts`:
```typescript
const openai = new OpenAI({
  apiKey: 'your-actual-api-key-here'
});
```

3. Build the project:
```bash
npm run build
```

4. Start the server:
```bash
npm start
```

Or for development:
```bash
npm run dev
```

## API Usage

### Chat Endpoint
`POST /chat`

Request body:
```json
{
  "message": "How do I link 3D elements to Gantt activities?",
  "conversationId": "optional-conversation-id"
}
```

Response:
```json
{
  "message": "To link 3D elements to Gantt activities, you can...",
  "conversationId": "conv_1234567890_abc123def"
}
```

### Health Check
`GET /health`

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Features

- Context-aware responses about AEC application features
- Conversation memory (in-memory, per session)
- Simple message in/message out interface
- No hardcoded keyword parsing - uses AI to interpret intent 