require('dotenv').config();
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const app = require("./src/app")
const connectDB = require('./src/db/db')

app.set('trust proxy', 1)
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'],
  credentials: true
}))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Start HTTP server only when not running on Vercel
if (!process.env.VERCEL) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running locally on http://localhost:${port}`);
  });
}

connectDB();

module.exports = app;
