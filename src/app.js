const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const foodRoutes = require('./routes/food.routes');
const foodPartnerRoutes = require('./routes/food-partner.routes');

app.use(cors());

app.use(cookieParser());
app.use(express.json());

// Probes/health
app.get('/', (_req, res) => res.status(200).json({ ok: true, service: 'foodgram-backend' }));
app.get('/api', (_req, res) => res.status(200).json({ ok: true, base: '/api' }));
app.get('/api/health', (_req, res) => res.status(200).json({ ok: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/food-partner', foodPartnerRoutes);

module.exports = app;