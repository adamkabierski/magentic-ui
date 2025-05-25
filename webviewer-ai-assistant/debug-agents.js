const aecSchema = require('./src/aec-schema.json');

console.log("🔍 Debugging agent schema processing...\n");

// Simulate what SchemaAnalystAgent.findRelevantSchemaWithAI sees
const schemaComponents = aecSchema.mainPipeline.nodes
  .map(node => `"${node.data.label}": ${node.data.description}`)
  .join('\n');

console.log("📋 First 5 schema components that AI will see:");
schemaComponents.split('\n').slice(0, 5).forEach(line => console.log(line));

console.log("\n🎯 Looking for 'Data mapping' in components:");
const hasDataMapping = schemaComponents.includes('Data mapping');
console.log("Found 'Data mapping':", hasDataMapping);

if (hasDataMapping) {
  const dataMappingLine = schemaComponents.split('\n').find(line => 
    line.includes('Data mapping')
  );
  console.log("Data mapping line:", dataMappingLine);
} 