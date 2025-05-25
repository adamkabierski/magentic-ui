const { AgentTeam } = require('./dist/agents');

async function testAISchemaApproach() {
  console.log("🧪 Testing AI-driven schema analysis approach...\n");
  
  // Replace with your actual API key
  const apiKey = "your-openai-api-key-here";
  const agentTeam = new AgentTeam(apiKey);

  const testQueries = [
    "What is data mapping?",
    "How does data mapping work?", 
    "Tell me about the data mapping feature",
    "Where can I find data mapping in the interface?",
    "What's the purpose of data mapping panel?"
  ];

  for (const query of testQueries) {
    console.log(`\n🔍 Query: "${query}"`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    try {
      const response = await agentTeam.processMessage(query);
      console.log(`📝 Response: ${response}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    // Add delay between requests to be respectful to API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

if (require.main === module) {
  testAISchemaApproach().catch(console.error);
}

module.exports = { testAISchemaApproach }; 