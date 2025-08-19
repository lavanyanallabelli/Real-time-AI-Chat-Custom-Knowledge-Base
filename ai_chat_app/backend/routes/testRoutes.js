import express from 'express';
import { db } from '../config/firebase.js';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

const router = express.Router();

// GET /api/test/db-connection
router.get('/db-connection', async (req, res) => {
    try {
        console.log('Testing Firebase connection...');

        // Test 1: Try to write a test document
        const testData = {
            test: true,
            timestamp: new Date().toISOString(),
            message: 'Database connection test'
        };

        const docRef = await addDoc(collection(db, 'connection_test'), testData);
        console.log('✅ Write test successful - Document written with ID:', docRef.id);

        // Test 2: Try to read the test document
        const querySnapshot = await getDocs(collection(db, 'connection_test'));
        const documents = [];
        querySnapshot.forEach((doc) => {
            documents.push({ id: doc.id, ...doc.data() });
        });
        console.log('✅ Read test successful - Found', documents.length, 'documents');

        // Test 3: Clean up test document
        await deleteDoc(doc(db, 'connection_test', docRef.id));
        console.log('✅ Cleanup test successful - Test document deleted');

        res.json({
            status: 'success',
            message: 'Firebase database connection is working!',
            tests: {
                write: '✅ Passed',
                read: '✅ Passed',
                cleanup: '✅ Passed'
            },
            details: {
                documentsFound: documents.length,
                testDocumentId: docRef.id,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Database connection test failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Firebase database connection failed',
            error: error.message,
            code: error.code,
            timestamp: new Date().toISOString()
        });
    }
});

// GET /api/test/db-status
router.get('/db-status', async (req, res) => {
    try {
        // Simple status check without writing data
        const querySnapshot = await getDocs(collection(db, 'documents'));
        const documentCount = querySnapshot.size;

        res.json({
            status: 'connected',
            message: 'Firebase database is connected and accessible',
            stats: {
                totalDocuments: documentCount,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Database status check failed:', error);
        res.status(500).json({
            status: 'disconnected',
            message: 'Firebase database is not accessible',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

export default router;
