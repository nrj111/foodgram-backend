require('dotenv').config();
const app = require("./src/app")
const connectDB = require('./src/db/db')

app.set('trust proxy', 1) // needed for secure cookies behind reverse proxy (Vercel)

connectDB();

// Start HTTP server only when not running on Vercel
if (!process.env.VERCEL) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running locally on http://localhost:${port}`);
  });
}

module.exports = app;
