require('dotenv').config();

// Fail fast — catch missing env vars before any module reads them
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  console.error('   Make sure backend/.env exists and contains these keys.');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const path = require('path');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');

const app = express();
app.use(cors({
  origin: 'https://messianic784-shopnow-ecommerce.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
connectDB();

const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL,
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'null'
].filter(Boolean);

const corsOptions = {
  // Use a function so origin mismatches are logged in development
  origin: (origin, callback) => {
    // Allow requests with no Origin header (e.g. curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️  CORS blocked request from: ${origin}`);
      console.warn(`   Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
    }
    callback(new Error(`CORS: origin ${origin} is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Respond to ALL OPTIONS preflight requests at the middleware layer,
// before Express tries to match routes. Without this, a preflight
// to a route that hasn't been mounted yet returns 404.
app.options('*', cors(corsOptions));

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date() });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`❤️  Health: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
