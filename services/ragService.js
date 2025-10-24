const { initChromaDB } = require('../config/chromadb');
const { pipeline } = require('@xenova/transformers');

let embedder = null;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedder;
}

async function getContextFromRAG(query, topK = 3) {
  try {
    const collection = await initChromaDB();
    const model = await getEmbedder();
    
    const embedding = await model(query, { pooling: 'mean', normalize: true });
    const queryEmbedding = Array.from(embedding.data);

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK
    });

    if (!results.documents || results.documents.length === 0) {
      console.log('⚠️ Tidak ada konteks relevan ditemukan di RAG');
      return '';
    }

    const contextDocs = results.documents[0];
    console.log(`📚 Mengambil ${contextDocs.length} konteks dari RAG`);
    return contextDocs.join('\n\n');
  } catch (error) {
    console.error('❌ Gagal mengambil konteks RAG:', error);
    return '';
  }
}

module.exports = { getContextFromRAG };