import fs from 'fs';
import path from "path";
import mammoth from 'mammoth';
import { createEmbeddings } from '../utils/embeddingUtils.js';
import { saveDocument, createSession, updateSessionActivity } from '../services/firebaseService.js';

export const uploadDocument = async (req, res) => {
    try {
        const file = req.file;
        const { sessionId } = req.body;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }

        const filePath = file.path;
        const mimetype = file.mimetype;

        let text = "";

        if (mimetype === 'application/pdf') {
            try {
                const dataBuffer = fs.readFileSync(filePath);
                const pdfParse = await import('pdf-parse');
                const pdfData = await pdfParse.default(dataBuffer);
                text = pdfData.text;
                console.log('PDF text extracted:', text.length, 'characters');
            } catch (pdfError) {
                console.error('PDF parsing error:', pdfError.message);
                text = "PDF file uploaded but text extraction failed. Please try a different PDF or DOCX file.";
            }
        } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ path: filePath });
            text = result.value;
        } else {
            return res.status(400).json({ error: 'Unsupported file type' });
        }

        // Generate embeddings
        const embeddings = await createEmbeddings(text);

        // Save document to Firebase
        const documentData = {
            filename: file.originalname,
            content: text,
            embeddings: embeddings,
            mimetype: mimetype
        };

        const documentId = await saveDocument(sessionId, documentData);

        // Create or update session
        await createSession(sessionId);
        await updateSessionActivity(sessionId);

        console.log(`Document saved to Firebase: ${file.originalname} (${text.length} characters)`);
        console.log(`Document ID: ${documentId}`);

        // Delete temp file
        if (file && file.path) {
            try {
                fs.unlinkSync(file.path);
            } catch (unlinkErr) {
                console.warn('Could not delete temp file:', unlinkErr.message);
            }
        }

        res.json({
            message: 'File uploaded & processed',
            textSnippet: text.slice(0, 200),
            documentId: documentId
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
