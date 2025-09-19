require('dotenv').config();
const app = require("./src/app")
const connectDB = require('./src/db/db')

app.set('trust proxy', 1) // secure cookies behind proxy (Vercel)

connectDB();

// Start HTTP server only when not running on Vercel
if (!process.env.VERCEL) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running locally on http://localhost:${port}`);
  });
}

const cors = require('cors');

// CORS options
const corsOptions = {
  origin: function (origin, cb) {
    const ok = !origin || process.env.ALLOWED_ORIGINS?.split(',').includes(origin);
    return ok ? cb(null, true) : cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
};

app.set('trust proxy', 1); // needed for secure cookies behind reverse proxy (Vercel)
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Probes and health
app.get('/', (req, res) => res.status(200).json({ ok: true, service: 'foodgram-backend', base: '/' }));
app.get('/api', (req, res) => res.status(200).json({ ok: true, base: '/api' }));
// app.get('/api/health', (req, res) => res.status(200).json({ ok: true }));
app.get('/api/health', (req, res) => res.send(console.log("Backend")));

module.exports = app;
