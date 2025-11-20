import express from 'express';
import cors from 'cors';
import nrrRoutes from './routes/nrrRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/nrr', nrrRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

export default app;

