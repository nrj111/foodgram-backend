const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const foodRoutes = require('./routes/food.routes');
const foodPartnerRoutes = require('./routes/food-partner.routes');

// CORS: allow localhost dev and your deployed frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://foodgram-frontend.vercel.app',
  process.env.FRONTEND_ORIGIN,
  process.env.FRONTEND_ORIGIN_2,
].filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const ok = allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin);
    return ok ? cb(null, true) : cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204
};

app.set('trust proxy', 1);

// reflect CORS per-origin and avoid cache mixups at the edge
app.use((req, res, next) => {
  res.header('Vary', 'Origin');
  next();
});

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

// Probes/health
app.get('/', (_req, res) => res.status(200).json({ ok: true, service: 'foodgram-backend' }));
app.get('/api', (_req, res) => res.status(200).json({ ok: true, base: '/api' }));
app.get('/api/health', (_req, res) => res.status(200).json({ ok: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/food-partner', foodPartnerRoutes);

module.exports = app;