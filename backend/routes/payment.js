const express = require('express');
const { getConfig, createPaymentIntent } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public — only exposes publishable keys (safe to expose)
router.get('/config', getConfig);

// Private — creates a server-side PaymentIntent
router.post('/create-intent', protect, createPaymentIntent);

module.exports = router;
