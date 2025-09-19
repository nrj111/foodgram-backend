require('dotenv').config();
const app = require("./src/app")
const connectDB = require('./src/db/db')
const cors = require('cors')

// Allow localhost:5173 and Vercel frontends
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_ORIGIN,
  process.env.FRONTEND_ORIGIN_2,
].filter(Boolean)

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    const ok = allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)
    return ok ? cb(null, true) : cb(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
}

app.set('trust proxy', 1) // needed for secure cookies behind reverse proxy (Vercel)
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

// Probes and health
app.get('/', (req, res) => res.status(200).json({ ok: true, service: 'foodgram-backend', base: '/' }));
app.get('/api', (req, res) => res.status(200).json({ ok: true, base: '/api' }));
app.get('/api/health', (req, res) => res.status(200).json({ ok: true }));

connectDB();

// Start HTTP server only when not running on Vercel
if (!process.env.VERCEL) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running locally on http://localhost:${port}`);
  });
}

module.exports = app;
