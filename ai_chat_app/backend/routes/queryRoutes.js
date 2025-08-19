import express from 'express';
import { askQuery } from '../controllers/queryController.js';
import { getConversationHistory } from '../services/firebaseService.js';

const router = express.Router();

// POST /api/query
router.post('/', askQuery);

// GET /api/query/history/:sessionId
router.get('/history/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const history = await getConversationHistory(sessionId);
        res.json({ history });
    } catch (error) {
        console.error('Error getting conversation history:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
