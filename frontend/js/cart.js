/* ═══════════════════════════════════════════════════════════
   Cart.js - Shopping cart page logic
═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  renderCart();
});

function renderCart() {
  const cart = getCart();
  const container = document.getElementById('cartItemsList');
  const summary = document.getElementById('cartSummary');
  const emptyMsg = document.getElementById('cartEmpty');
  const cartWithItems = document.getElementById('cartWithItems');

  if (!container) return;

  if (cart.length === 0) {
    if (emptyMsg) emptyMsg.style.display = 'block';
    if (cartWithItems) cartWithItems.style.display = 'none';
    return;
  }

  if (emptyMsg) emptyMsg.style.display = 'none';
  if (cartWithItems) cartWithItems.style.display = 'grid';

  container.innerHTML = cart.map(item => `
    <div class="cart-item fade-in" data-id="${item._id}">
      <div class="cart-item-img">
        <a href="/product-detail.html?id=${item._id}">
          <img src="${getImageUrl(item.image) || 'https://placehold.co/200x200?text=No+Image'}" alt="${item.name}" loading="lazy" onerror="this.src='https://placehold.co/200x200?text=No+Image'">
        </a>
      </div>
      <div class="cart-item-details">
        <div class="cart-item-name">
          <a href="/product-detail.html?id=${item._id}">${item.name}</a>
        </div>
        <div class="cart-item-meta">Unit price: ${formatPrice(item.price)}</div>
        <div class="cart-item-price">${formatPrice(item.price * item.quantity)}</div>
        <div class="cart-item-controls">
          <div class="qty-control">
            <button class="qty-btn" onclick="changeQty('${item._id}', ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''}>
              <i class="fas fa-minus"></i>
            </button>
            <span class="qty-value">${item.quantity}</span>
            <button class="qty-btn" onclick="changeQty('${item._id}', ${item.quantity + 1})" ${item.quantity >= (item.stock || 99) ? 'disabled' : ''}>
              <i class="fas fa-plus"></i>
            </button>
          </div>
          <button class="cart-remove-btn" onclick="removeItem('${item._id}')" title="Remove item">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  renderSummary(cart);
}

function renderSummary(cart) {
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal >= 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  const el = document.getElementById('summaryContent');
  if (!el) return;

  el.innerHTML = `
    <div class="summary-row">
      <span>Items (${totalItems})</span>
      <span>${formatPrice(subtotal)}</span>
    </div>
    <div class="summary-row">
      <span>Shipping</span>
      <span>${shipping === 0 ? '<span class="text-success">FREE</span>' : formatPrice(shipping)}</span>
    </div>
    <div class="summary-row">
      <span>Tax (8%)</span>
      <span>${formatPrice(tax)}</span>
    </div>
    <div class="summary-row total">
      <span>Total</span>
      <span>${formatPrice(total)}</span>
    </div>
    ${subtotal < 50 && subtotal > 0 ? `
      <div style="font-size:0.82rem;color:var(--text-muted);margin-top:0.75rem;text-align:center;">
        <i class="fas fa-info-circle"></i> Add ${formatPrice(50 - subtotal)} more for free shipping!
      </div>
    ` : ''}
    <a href="/checkout.html" class="btn btn-primary btn-full mt-2" style="margin-top:1rem;">
      <i class="fas fa-lock"></i> Proceed to Checkout
    </a>
    <a href="/products.html" class="btn btn-ghost btn-full btn-sm" style="margin-top:0.5rem;">
      <i class="fas fa-arrow-left"></i> Continue Shopping
    </a>
  `;
}

function changeQty(productId, newQty) {
  if (newQty < 1) return;
  updateCartQuantity(productId, newQty);
  renderCart();
}

function removeItem(productId) {
  removeFromCart(productId);
  renderCart();
  showToast('Item removed from cart', 'info');
}

function clearCartItems() {
  if (!getCart().length) return;
  if (confirm('Clear all items from cart?')) {
    clearCart();
    renderCart();
    showToast('Cart cleared', 'info');
  }
}
