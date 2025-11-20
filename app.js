import express from 'express';
import cors from 'cors';
import nrrRoutes from './routes/nrrRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/nrr', nrrRoutes);

// Root landing message for browser hits
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'This is the CricHeroes API' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

export default app;

