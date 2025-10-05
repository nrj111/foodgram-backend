require('dotenv').config();
const app = require("./src/app");
const connectDB = require('./src/db/db');

// START DB once
connectDB();

// Local development only (Vercel provides serverless entry)
if (!process.env.VERCEL) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running locally on http://localhost:${port}`);
  });
}

// Single export (removed duplicate second block)
module.exports = app;
if (!process.env.VERCEL) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running locally on http://localhost:${port}`);
  });
}

connectDB();

module.exports = app;
