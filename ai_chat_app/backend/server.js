import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
//import { createClient } from 'redis';
import documentRoutes from './routes/documentRoutes.js';
import queryRoutes from './routes/queryRoutes.js';


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Redis client
// const redisClient = createClient({ url: 'redis://localhost:6379' });
// redisClient.connect()
// .then(() => console.log('Connected to Redis'))
// .catch(err => console.error('Redis connection error:', err));
// 
// 
//Make Redis available in request object
// app.use((req, res, next) => {
// req.redisClient = redisClient;
// next();
// });
// 
// Routes
app.use('/api/documents', documentRoutes);
app.use('/api/query', queryRoutes);


// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});