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

        let context = "";
        let documentsUsed = [];

        if (uploadedDocs.length > 0) {
            context = "Based on the uploaded documents:\n\n";
            uploadedDocs.forEach((doc, index) => {
                console.log(`Document ${index + 1}: ${doc.filename} (${doc.content.length} chars)`);
                context += `Document ${index + 1} (${doc.filename}):\n${doc.content}\n\n`;
                documentsUsed.push({
                    id: doc.id,
                    filename: doc.filename
                });
            });
        } else {
            context = "No documents have been uploaded yet. Please upload a document first.";
        }

        // Call OpenAI to generate an answer with document context
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that answers questions based on uploaded documents. Always reference the specific document when providing information."
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