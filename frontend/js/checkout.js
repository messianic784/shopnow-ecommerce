/* ═══════════════════════════════════════════════════════════
   Checkout.js - Payment-first checkout flow
   Order: validate → charge card → create order only on success
═══════════════════════════════════════════════════════════ */

let stripeInstance  = null;
let cardElement     = null;
let gatewayConfig   = {};   // { stripePublishableKey, stripeEnabled }

/* ── Bootstrap ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  const cart = getCart();
  if (cart.length === 0) {
    window.location.href = '/cart.html';
    return;
  }

  renderOrderReview(cart);
  await prefillUserAddress();
  await initGateways();
  initPaymentMethodSwitcher();

  document.getElementById('checkoutForm')?.addEventListener('submit', handleCheckout);
});

/* ── Order review (right column) ───────────────────────────── */
function renderOrderReview(cart) {
  const container = document.getElementById('orderReviewItems');
  if (!container) return;

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping  = subtotal >= 50 ? 0 : 9.99;
  const tax       = subtotal * 0.08;
  const total     = subtotal + shipping + tax;

  container.innerHTML = cart.map(item => `
    <div class="order-review-item">
      <div class="order-review-img">
        <img src="${getImageUrl(item.image) || 'https://placehold.co/52x52?text=?'}"
             alt="${item.name}" onerror="this.src='https://placehold.co/52x52?text=?'">
      </div>
      <div class="order-review-name">
        ${item.name}
        <div class="order-review-qty">Qty: ${item.quantity}</div>
      </div>
      <div class="order-review-price">${formatPrice(item.price * item.quantity)}</div>
    </div>
  `).join('');

  const summaryEl = document.getElementById('checkoutSummary');
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="summary-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
      <div class="summary-row"><span>Shipping</span>
        <span>${shipping === 0 ? '<span class="text-success">FREE</span>' : formatPrice(shipping)}</span>
      </div>
      <div class="summary-row"><span>Tax (8%)</span><span>${formatPrice(tax)}</span></div>
      <div class="summary-row total"><span>Order Total</span><span>${formatPrice(total)}</span></div>
    `;
  }

  // Store totals on the form so handleCheckout can read them
  const form = document.getElementById('checkoutForm');
  if (form) {
    form.dataset.subtotal = subtotal.toFixed(2);
    form.dataset.shipping  = shipping.toFixed(2);
    form.dataset.tax       = tax.toFixed(2);
    form.dataset.total     = total.toFixed(2);
  }
}

/* ── Prefill address from profile ──────────────────────────── */
async function prefillUserAddress() {
  try {
    const data = await Users.getProfile();
    const user = data.user;
    if (!user) return;
    const fields = {
      firstName: user.name?.split(' ')[0] || '',
      lastName:  user.name?.split(' ').slice(1).join(' ') || '',
      email:     user.email || '',
      phone:     user.phone || '',
      street:    user.address?.street || '',
      city:      user.address?.city || '',
      state:     user.address?.state || '',
      country:   user.address?.country || '',
      zipCode:   user.address?.zipCode || ''
    };
    Object.entries(fields).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el && !el.value) el.value = val;
    });
  } catch (_) {}
}

/* ── Initialise Stripe ──────────────────────────────────────── */
async function initGateways() {
  try {
    gatewayConfig = (await Payment.getConfig()) || {};
  } catch (err) {
    // Surface the failure so it's visible in the browser dev-tools console,
    // not silently swallowed. Common causes: server is down, CORS mismatch,
    // or the /api/payment/config route isn't registered.
    console.error('[Checkout] Failed to fetch payment gateway config:', err.message);
    console.error('  → Make sure the backend is running and http://localhost:5000/api/payment/config is reachable.');
    gatewayConfig = {};
  }

  // ── Stripe ──────────────────────────────────────────────────
  // Step 1: attempt Stripe initialisation. Keep init separate from the rest of
  // the block so a bad key can't leave the UI half-configured.
  if (gatewayConfig.stripeEnabled && typeof Stripe !== 'undefined') {
    try {
      stripeInstance = Stripe(gatewayConfig.stripePublishableKey);
    } catch (stripeInitErr) {
      // Stripe.js throws synchronously when the key format is invalid.
      // The most common cause: a garbled key where the placeholder prefix
      // (e.g. "pk_test_YOUR_KEY") wasn't fully deleted before pasting.
      console.error('[Checkout] Stripe initialisation failed:', stripeInitErr.message);
      console.error('  → Check STRIPE_PUBLISHABLE_KEY in backend/.env');
      console.error('    It must start with pk_test_ or pk_live_ and contain no extra text before it.');
      stripeInstance = null;
    }
  }

  // Step 2: mount the card element only if init succeeded.
  if (stripeInstance) {
    const elements = stripeInstance.elements();
    const isDark   = document.body.classList.contains('dark');

    cardElement = elements.create('card', {
      style: {
        base: {
          color:           isDark ? '#f1f5f9' : '#1e293b',
          fontFamily:      '"Segoe UI", system-ui, -apple-system, sans-serif',
          fontSize:        '15px',
          fontSmoothing:   'antialiased',
          '::placeholder': { color: isDark ? '#64748b' : '#94a3b8' }
        },
        invalid: { color: '#ef4444', iconColor: '#ef4444' }
      }
    });

    cardElement.mount('#stripe-card-element');
    cardElement.on('change', (event) => {
      const el = document.getElementById('card-errors');
      if (el) el.textContent = event.error ? event.error.message : '';
    });

    // Remove the test-card hint when using live keys
    const hint = document.getElementById('stripe-test-hint');
    if (hint && !gatewayConfig.stripePublishableKey?.startsWith('pk_test_')) {
      hint.remove();
    }
  } else {
    // Stripe not available or init failed — disable card options visibly
    document.querySelectorAll('input[value="Credit Card"], input[value="Debit Card"]').forEach(radio => {
      radio.disabled = true;
      const label = radio.closest('.payment-option');
      if (label) {
        label.style.opacity = '0.45';
        label.title = 'Card payments unavailable — check STRIPE_PUBLISHABLE_KEY in backend/.env';
      }
    });
  }

  // Trigger initial UI for the default-selected method (Credit Card)
  handlePaymentMethodChange();
}

/* ── Show / hide card panel on radio change ─────────────────── */
function initPaymentMethodSwitcher() {
  document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
    radio.addEventListener('change', handlePaymentMethodChange);
  });
}

function handlePaymentMethodChange() {
  const method      = document.querySelector('input[name="paymentMethod"]:checked')?.value;
  const cardSection = document.getElementById('stripe-card-section');

  if (cardSection) {
    cardSection.style.display = (method === 'Credit Card' || method === 'Debit Card') ? 'block' : 'none';
  }
}

/* ── Form validation (shared by both submit paths) ─────────── */
function validateShippingForm() {
  const required = ['firstName', 'street', 'city', 'state', 'country', 'zipCode'];
  let valid = true;
  required.forEach(id => {
    const el = document.getElementById(id);
    if (!el || !el.value.trim()) {
      el?.classList.add('error');
      valid = false;
    } else {
      el.classList.remove('error');
    }
  });
  if (!valid) showToast('Please fill in all required shipping fields', 'warning');
  return valid;
}

/* ── Build the order payload from form state ───────────────── */
function buildOrderData(paymentMethod) {
  const cart = getCart();
  const form = document.getElementById('checkoutForm');
  return {
    orderItems: cart.map(item => ({
      product:  item._id,
      name:     item.name,
      image:    item.image || '',
      price:    item.price,
      quantity: item.quantity
    })),
    shippingAddress: {
      street:  `${document.getElementById('street').value} ${document.getElementById('apartment')?.value || ''}`.trim(),
      city:    document.getElementById('city').value,
      state:   document.getElementById('state').value,
      country: document.getElementById('country').value,
      zipCode: document.getElementById('zipCode').value
    },
    paymentMethod,
    itemsPrice:  parseFloat(form.dataset.subtotal),
    shippingPrice: parseFloat(form.dataset.shipping),
    taxPrice:    parseFloat(form.dataset.tax),
    totalPrice:  parseFloat(form.dataset.total),
    notes:       document.getElementById('orderNotes')?.value || ''
  };
}

/* ── Main form submit handler ───────────────────────────────── */
async function handleCheckout(e) {
  e.preventDefault();
  if (!validateShippingForm()) return;

  const cart = getCart();
  if (cart.length === 0) { showToast('Your cart is empty', 'error'); return; }

  const method    = document.querySelector('input[name="paymentMethod"]:checked')?.value;
  const submitBtn = document.getElementById('placeOrderBtn');

  if (!method) { showToast('Please select a payment method', 'warning'); return; }

  if (method === 'Cash on Delivery') {
    await placeCODOrder(submitBtn);
  } else if (method === 'Credit Card' || method === 'Debit Card') {
    await processStripePayment(submitBtn, method);
  }
}

/* ── Cash on Delivery ───────────────────────────────────────── */
async function placeCODOrder(btn) {
  setBtnLoading(btn, true, 'Placing Order…');
  try {
    const data = await Orders.create(buildOrderData('Cash on Delivery'));
    clearCart();
    showToast('Order placed! Pay on delivery.', 'success');
    setTimeout(() => window.location.href = `/orders.html?newOrder=${data.order._id}`, 1200);
  } catch (err) {
    showToast(err.message, 'error');
    setBtnLoading(btn, false);
  }
}

/* ── Stripe (Credit Card / Debit Card) ─────────────────────── */
async function processStripePayment(btn, method) {
  if (!stripeInstance || !cardElement) {
    showToast('Card payments are not configured. Add Stripe keys to backend/.env', 'error');
    return;
  }

  setBtnLoading(btn, true, 'Processing payment…');

  try {
    const total = parseFloat(document.getElementById('checkoutForm').dataset.total);

    // Step 1 — Ask the backend to create a PaymentIntent and return the client_secret.
    //          The backend never sees raw card data; Stripe handles that via its iframe.
    const { clientSecret } = await Payment.createIntent({ amount: total });

    // Step 2 — Confirm the charge via Stripe.js. Stripe's iframe collects the card
    //          number directly; it never passes through our server.
    const billingName = [
      document.getElementById('firstName')?.value,
      document.getElementById('lastName')?.value
    ].filter(Boolean).join(' ');

    const { paymentIntent, error } = await stripeInstance.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name:  billingName,
          email: document.getElementById('email')?.value || undefined
        }
      }
    });

    if (error) {
      // Stripe returns user-friendly messages (e.g. "Your card was declined.")
      document.getElementById('card-errors').textContent = error.message;
      showToast(error.message, 'error');
      setBtnLoading(btn, false);
      return;
    }

    if (paymentIntent.status !== 'succeeded') {
      showToast(`Payment status: ${paymentIntent.status}. Please try again.`, 'warning');
      setBtnLoading(btn, false);
      return;
    }

    // Step 3 — Payment confirmed by Stripe. Now create the order in our backend.
    setBtnLoading(btn, true, 'Creating order…');
    const orderRes = await Orders.create(buildOrderData(method));

    // Step 4 — Record the payment details on the order (Stripe payment ID, status, etc.)
    await Orders.pay(orderRes.order._id, {
      id:            paymentIntent.id,
      status:        paymentIntent.status,
      update_time:   new Date().toISOString(),
      email_address: document.getElementById('email')?.value || ''
    });

    clearCart();
    showToast('Payment successful! Order confirmed.', 'success');
    setTimeout(() => window.location.href = `/orders.html?newOrder=${orderRes.order._id}`, 1200);

  } catch (err) {
    showToast(err.message, 'error');
    setBtnLoading(btn, false);
  }
}

/* ── Helpers ────────────────────────────────────────────────── */
function setBtnLoading(btn, loading, label = 'Loading…') {
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? `<span class="spinner spinner-sm" style="border-color:rgba(255,255,255,0.3);border-top-color:#fff"></span> ${label}`
    : '<i class="fas fa-lock"></i> Place Order';
}

