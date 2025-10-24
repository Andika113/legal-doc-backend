const { ChromaClient } = require('chromadb');

let client = null;
let collection = null;

async function initChromaDB() {
  if (!client) {
    client = new ChromaClient();
    collection = await client.getOrCreateCollection({
      name: 'legal_docs'
    });
  }
  return collection;
}

module.exports = { initChromaDB };