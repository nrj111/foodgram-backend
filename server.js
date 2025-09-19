require('dotenv').config();
const app = require("./src/app")
const connectDB = require('./src/db/db')

app.set('trust proxy', 1) // needed for secure cookies behind reverse proxy (Vercel)

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
