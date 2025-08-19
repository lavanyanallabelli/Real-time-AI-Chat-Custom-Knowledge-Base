import express from 'express';
import multer from 'multer';
import { uploadDocument } from '../controllers/documentController.js';
import { getDocumentsBySession } from '../services/firebaseService.js';

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

// POST /api/documents/upload
router.post('/upload', upload.single('document'), uploadDocument);

// GET /api/documents/:sessionId
router.get('/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const documents = await getDocumentsBySession(sessionId);

        res.json({
            success: true,
            documents: documents.map(doc => ({
                id: doc.id,
                filename: doc.filename,
                uploadedAt: doc.uploadedAt,
                contentLength: doc.content.length,
                mimetype: doc.mimetype
            })),
            totalDocuments: documents.length
        });
    } catch (error) {
        console.error('Error getting documents:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;