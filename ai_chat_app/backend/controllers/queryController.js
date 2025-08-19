import OpenAI from "openai";
import { getDocumentsBySession, saveConversation, updateSessionActivity } from '../services/firebaseService.js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const askQuery = async (req, res) => {
    try {
        const { userQuery, sessionId } = req.body;

        if (!userQuery) {
            return res.status(400).json({ error: "Question is required" });
        }

        if (!sessionId) {
            return res.status(400).json({ error: "Session ID is required" });
        }

        // Update session activity
        await updateSessionActivity(sessionId);

        // Get documents from Firebase
        const uploadedDocs = await getDocumentsBySession(sessionId);

        console.log(`Query received: "${userQuery}"`);
        console.log(`Available documents: ${uploadedDocs.length}`);

        // Calculate total content size
        const totalCharacters = uploadedDocs.reduce((sum, doc) => sum + doc.content.length, 0);
        const estimatedTokens = Math.ceil(totalCharacters / 4); // Rough estimate: 1 token ≈ 4 characters

        console.log(`📊 Document Stats:`);
        console.log(`   Total characters: ${totalCharacters.toLocaleString()}`);
        console.log(`   Estimated tokens: ${estimatedTokens.toLocaleString()}`);
        console.log(`   Token limit: 128,000 (GPT-4o-mini)`);
        console.log(`   Usage: ${((estimatedTokens / 128000) * 100).toFixed(1)}% of limit`);

        let context = "";
        let documentsUsed = [];

        if (uploadedDocs.length > 0) {
            // Check if we're approaching token limits
            const isLargeDocumentSet = estimatedTokens > 80000; // 80% of limit

            if (isLargeDocumentSet) {
                console.log(`⚠️  Large document set detected! Consider using semantic search for better performance.`);
            }

            context = `You have access to ${uploadedDocs.length} uploaded document(s). Please provide accurate answers based on these documents:\n\n`;

            uploadedDocs.forEach((doc, index) => {
                console.log(`Document ${index + 1}: ${doc.filename} (${doc.content.length} chars)`);
                context += `--- DOCUMENT ${index + 1}: ${doc.filename} ---\n`;
                context += `${doc.content}\n\n`;
                documentsUsed.push({
                    id: doc.id,
                    filename: doc.filename,
                    contentLength: doc.content.length
                });
            });

            context += `\nIMPORTANT: When answering, always specify which document(s) you're referencing. If the information isn't in any of these documents, say so clearly.`;

            if (isLargeDocumentSet) {
                context += `\n\nNOTE: You have access to a large number of documents. Focus on the most relevant information for the user's question.`;
            }
        } else {
            context = "No documents have been uploaded yet. Please upload a document first.";
        }

        // Call OpenAI to generate an answer with document context
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are an intelligent document analysis assistant. Your role is to:

1. Analyze multiple uploaded documents thoroughly
2. Provide accurate, contextual answers based ONLY on the provided documents
3. Always specify which document(s) you're referencing in your answers
4. If information is not found in any document, clearly state this
5. For multi-document questions, synthesize information across relevant documents
6. Provide specific citations (e.g., "According to Document 1: filename.pdf...")
7. Be concise but comprehensive in your responses

Format your responses with clear document references and structured information.`
                },
                {
                    role: "user",
                    content: `Context:\n${context}\n\nQuestion: ${userQuery}`
                },
            ],
        });

        const answer = completion.choices[0].message.content;

        // Save conversation to Firebase
        const conversationData = {
            userQuery,
            aiResponse: answer,
            documentsUsed,
            cached: false
        };

        await saveConversation(sessionId, conversationData);

        res.json({
            answer,
            cached: false,
            documentsUsed,
            sessionId
        });
    } catch (err) {
        console.error("Error in askQuery:", err);
        res.status(500).json({ error: "Server error" });
    }
};



// 