require('dotenv').config();
const app = require('./app');
const connectDB = require('./db/db');

// Environment variable validation on startup
function validateEnvironment() {
  const requiredVars = ['JWT_SECRET', 'MONGODB_URI'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('\x1b[31m%s\x1b[0m', '🚨 ERROR: Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`  - ${varName}`);
    });
    console.error('\nPlease add these variables to your .env file and restart the server.');
    console.error('Example .env format:');
    console.error('JWT_SECRET=your-strong-secret-key-here');
    console.error('MONGODB_URI=mongodb://localhost:27017/foodapp\n');
    
    // In production, we should exit, but for development let's just warn
    if (process.env.NODE_ENV === 'production') {
      console.error('Exiting due to missing environment variables');
      process.exit(1);
    }
  }
}

// Connect to MongoDB
validateEnvironment();
connectDB();

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📁 API base: http://localhost:${PORT}/api`);
  console.log(`🔒 JWT authentication enabled\n`);
});
