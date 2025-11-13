// src/app.js
const express = require('express');
const cors = require('cors');
const roundsRouter = require('./routes/rounds');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/rounds', roundsRouter);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Plinko backend running 🚀' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
