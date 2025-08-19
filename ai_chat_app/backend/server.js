import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import documentRoutes from './routes/documentRoutes.js';
import queryRoutes from './routes/queryRoutes.js';
import testRoutes from './routes/testRoutes.js';
// Test Firebase connection on startup
import { db } from './config/firebase.js';
import { collection, getDocs } from 'firebase/firestore';


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        message: 'AI Chat App Backend is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Routes
app.use('/api/documents', documentRoutes);
app.use('/api/query', queryRoutes);
app.use('/api/test', testRoutes);


// Start server
app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);

    // Test Firebase connection
    try {
        console.log('Testing Firebase connection...');
        const querySnapshot = await getDocs(collection(db, 'documents'));
        console.log('✅ Firebase connected successfully!');
        console.log(`📊 Total documents in database: ${querySnapshot.size}`);
    } catch (error) {
        console.error('❌ Firebase connection failed:', error.message);
        console.log('💡 Make sure your .env file has correct Firebase configuration');
    }
});