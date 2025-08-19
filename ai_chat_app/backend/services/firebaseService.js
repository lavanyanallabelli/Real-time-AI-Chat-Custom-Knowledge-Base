import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase.js';

// Document Management
export const saveDocument = async (sessionId, documentData) => {
    try {
        const docRef = await addDoc(collection(db, 'documents'), {
            sessionId,
            filename: documentData.filename,
            content: documentData.content,
            embeddings: documentData.embeddings,
            uploadedAt: serverTimestamp(),
            mimetype: documentData.mimetype
        });
        console.log('Document saved with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error saving document:', error);
        throw error;
    }
};

export const getDocumentsBySession = async (sessionId) => {
    try {
        const q = query(
            collection(db, 'documents'),
            where('sessionId', '==', sessionId),
            orderBy('uploadedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const documents = [];
        querySnapshot.forEach((doc) => {
            documents.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return documents;
    } catch (error) {
        console.error('Error getting documents:', error);
        throw error;
    }
};

// Conversation History Management
export const saveConversation = async (sessionId, conversationData) => {
    try {
        const docRef = await addDoc(collection(db, 'conversations'), {
            sessionId,
            userQuery: conversationData.userQuery,
            aiResponse: conversationData.aiResponse,
            documentsUsed: conversationData.documentsUsed || [],
            timestamp: serverTimestamp(),
            cached: conversationData.cached || false
        });
        console.log('Conversation saved with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error saving conversation:', error);
        throw error;
    }
};

export const getConversationHistory = async (sessionId, limit = 50) => {
    try {
        const q = query(
            collection(db, 'conversations'),
            where('sessionId', '==', sessionId),
            orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const conversations = [];
        querySnapshot.forEach((doc) => {
            conversations.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return conversations.slice(0, limit);
    } catch (error) {
        console.error('Error getting conversation history:', error);
        throw error;
    }
};

// Session Management
export const createSession = async (sessionId, userData = {}) => {
    try {
        const docRef = await addDoc(collection(db, 'sessions'), {
            sessionId,
            createdAt: serverTimestamp(),
            lastActive: serverTimestamp(),
            documentCount: 0,
            conversationCount: 0,
            ...userData
        });
        console.log('Session created with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error creating session:', error);
        throw error;
    }
};

export const updateSessionActivity = async (sessionId) => {
    try {
        const q = query(
            collection(db, 'sessions'),
            where('sessionId', '==', sessionId)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const sessionDoc = querySnapshot.docs[0];
            await updateDoc(doc(db, 'sessions', sessionDoc.id), {
                lastActive: serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error updating session activity:', error);
    }
}; 