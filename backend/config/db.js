const mongoose = require('mongoose');

const RETRY_DELAY_MS = 5000;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  // Configuration mistakes — retrying will never fix these, so exit immediately.
  if (!uri) {
    console.error('❌ MONGODB_URI is missing from backend/.env');
    console.error('   Add your MongoDB Atlas connection string and restart.');
    process.exit(1);
  }

  if (uri.includes('YOUR_PASSWORD') || uri.includes('XXXXX')) {
    console.error('❌ MONGODB_URI still has placeholder values in backend/.env');
    console.error('   Replace YOUR_PASSWORD and XXXXX with your real Atlas credentials.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    const msg = error.message;
    console.error(`❌ MongoDB Connection Error: ${msg}`);

    // Wrong credentials will never self-heal — exit so the developer notices immediately.
    if (msg.includes('bad auth') || msg.includes('Authentication failed')) {
      console.error('   → Wrong username or password. Check your Atlas Database User credentials.');
      process.exit(1);
    }

    // All remaining errors are treated as transient network conditions.
    if (msg.includes('ESERVFAIL') || msg.includes('queryTxt') || msg.includes('querySrv')) {
      console.error('   → DNS lookup failed. Your network may be temporarily down.');
    } else if (msg.includes('ENOTFOUND')) {
      console.error('   → Hostname not reachable. Network may be down or check your connection string.');
    } else if (msg.includes('ETIMEDOUT') || msg.includes('timed out')) {
      console.error('   → Connection timed out. Check Atlas → Network Access → IP whitelist.');
    }

    console.log(`🔄 Retrying MongoDB connection in ${RETRY_DELAY_MS / 1000}s...`);
    setTimeout(connectDB, RETRY_DELAY_MS);
  }
};

// Fires when the connection drops AFTER initial success (e.g. momentary network loss).
// Without this handler the server stays up but all DB calls silently fail.
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Scheduling reconnect in 5s...');
  setTimeout(connectDB, RETRY_DELAY_MS);
});

// Log runtime errors; 'disconnected' fires automatically afterwards, so the
// reconnect attempt above will still be scheduled.
mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB runtime error: ${err.message}`);
});

module.exports = connectDB;
