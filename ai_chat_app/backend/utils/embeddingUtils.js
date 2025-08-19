import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const createEmbeddings = async (text) => {
    try {
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-large',
            input: text
        });

        // Returns vector embeddings
        return response.data[0].embedding;
    } catch (err) {
        console.error('Embedding error:', err);
        return null;
    }
};

// Add retrieval function for RAG
export const getRelevantChunks = async (query) => {
    // For simplicity, this is a placeholder.
    // In production, search embeddings in Redis or FAISS to find top relevant chunks
    // Example: use cosine similarity between query embedding and document embeddings
    return "Top relevant text chunks from uploaded documents.";
};