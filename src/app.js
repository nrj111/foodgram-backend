const express = require('express');
const app = express();
const cookieParser = require("cookie-parser");
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const foodRoutes = require('./routes/food.routes');
const foodPartnerRoutes = require('./routes/food-partner.routes');

// Dynamic CORS: allow localhost dev and your deployed frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_ORIGIN,
  process.env.FRONTEND_ORIGIN_2,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser tools
    const isAllowed =
      allowedOrigins.includes(origin) ||
      /\.vercel\.app$/.test(origin); // allow any Vercel frontend
    return isAllowed ? callback(null, true) : callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // handle preflight globally

app.use(cookieParser());
app.use(express.json());

// Probes
app.get('/', (req, res) => res.status(200).json({ ok: true, service: 'foodgram-backend' }));
app.get('/api', (req, res) => res.status(200).json({ ok: true, base: '/api' }));
app.get('/api/health', (req, res) => res.status(200).json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/food-partner', foodPartnerRoutes);

module.exports = app;