const aecSchema = require('./src/aec-schema.json');

console.log("🔍 Debugging schema loading...\n");

console.log("📊 Schema structure:");
console.log("- Nodes count:", aecSchema.mainPipeline.nodes.length);
console.log("- Edges count:", aecSchema.mainPipeline.edges.length);

console.log("\n🎯 Looking for Data mapping:");
const dataMappingNode = aecSchema.mainPipeline.nodes.find(node => 
  node.data.label === "Data mapping"
);

if (dataMappingNode) {
  console.log("✅ Found Data mapping node:");
  console.log("- ID:", dataMappingNode.id);
  console.log("- Label:", dataMappingNode.data.label);
  console.log("- Description:", dataMappingNode.data.description);
  console.log("- Priority Level:", dataMappingNode.levelOfPriority);
} else {
  console.log("❌ Data mapping node NOT found!");
}

console.log("\n🔗 Looking for connections to Data mapping:");
const dataMappingConnections = aecSchema.mainPipeline.edges.filter(edge => 
  edge.target === "6" || edge.source === "6"
);

console.log(`Found ${dataMappingConnections.length} connections:`);
dataMappingConnections.forEach(edge => {
  const sourceNode = aecSchema.mainPipeline.nodes.find(n => n.id === edge.source);
  const targetNode = aecSchema.mainPipeline.nodes.find(n => n.id === edge.target);
  console.log(`- ${sourceNode?.data.label} → ${targetNode?.data.label}`);
  console.log(`  Connection: ${edge.data.connection}`);
});

console.log("\n📝 All node labels:");
aecSchema.mainPipeline.nodes.forEach(node => {
  console.log(`- ${node.id}: "${node.data.label}"`);
}); 