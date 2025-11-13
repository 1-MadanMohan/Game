// src/server.js
require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connect } = require('./config/db');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

(async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");

    await connect(MONGO_URI);

    console.log("✅ MongoDB Connected Successfully");

    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`\n======================================`);
      console.log(`🚀 Plinko Backend Started`);
      console.log(`🌐 Listening on PORT: ${PORT}`);
      console.log(`📦 Database: MongoDB Connected`);
      console.log(`======================================\n`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
})();
