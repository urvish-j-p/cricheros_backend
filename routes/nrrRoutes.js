import express from 'express';
import { getPointsTable, calculateNRRRange } from '../controllers/nrrController.js';

const router = express.Router();

// Get points table
router.get('/points-table', getPointsTable);

// Calculate NRR range
router.post('/calculate', calculateNRRRange);

export default router;

