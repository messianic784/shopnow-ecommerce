const getConfig = (req, res) => {
  const stripeKey = process.env.STRIPE_PUBLISHABLE_KEY;
  const paypalId  = process.env.PAYPAL_CLIENT_ID;

  res.json({
    success: true,
    stripePublishableKey: stripeKey || null,
    paypalClientId: paypalId || null,
    stripeEnabled: !!stripeKey,
    paypalEnabled: !!paypalId
  });
};

// POST /api/payment/create-intent
// Creates a Stripe PaymentIntent and returns the client_secret to the frontend.
// The frontend uses the client_secret to confirm the card charge via Stripe.js.
// The backend never receives raw card numbers — Stripe handles that entirely.
const createPaymentIntent = async (req, res, next) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({
        success: false,
        message: 'Stripe is not configured. Add STRIPE_SECRET_KEY to backend/.env'
      });
    }

    const { amount } = req.body;
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    // Initialise Stripe lazily so a missing key does not crash the server on boot
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(numericAmount * 100), // Stripe works in cents
      currency: 'usd',
      automatic_payment_methods: { enabled: true }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getConfig, createPaymentIntent };
