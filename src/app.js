const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const foodRoutes = require('./routes/food.routes');
const foodPartnerRoutes = require('./routes/food-partner.routes');

// Dynamic CORS: allow localhost dev and deployed frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_ORIGIN,    // e.g., https://your-frontend.vercel.app
  process.env.FRONTEND_ORIGIN_2,  // optional second origin
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // non-browser tools
    const ok = allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin);
    return ok ? callback(null, true) : callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(cookieParser());
app.use(express.json());

// Minimal request logger for Vercel logs
app.use((req, _res, next) => { console.log(`${req.method} ${req.url}`); next() });

// Probes/health
app.get('/', (_req, res) => res.status(200).json({ ok: true, service: 'foodgram-backend', base: '/' }));
app.get('/api', (_req, res) => res.status(200).json({ ok: true, base: '/api' }));
app.get('/api/health', (_req, res) => res.status(200).json({ ok: true }));

// Routers
app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/food-partner', foodPartnerRoutes);

module.exports = app;