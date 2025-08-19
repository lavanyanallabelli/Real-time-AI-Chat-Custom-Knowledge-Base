import express from 'express';
import multer from 'multer';
import { uploadDocument } from '../controllers/documentController.js';

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

// POST /api/documents/upload
router.post('/upload', upload.single('document'), uploadDocument);

export default router;