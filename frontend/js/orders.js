/* ═══════════════════════════════════════════════════════════
   Orders.js - Order history page logic
═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  await loadOrders();

  // Highlight new order
  const params = new URLSearchParams(window.location.search);
  if (params.get('newOrder')) {
    showToast('Your order has been placed successfully!', 'success', 'Order Confirmed');
  }
});

async function loadOrders() {
  const container = document.getElementById('ordersList');
  const emptyMsg = document.getElementById('ordersEmpty');
  if (!container) return;

  container.innerHTML = `<div class="loading-overlay"><div class="spinner"></div><p>Loading your orders...</p></div>`;

  try {
    const data = await Orders.myOrders();
    const orders = data.orders || [];

    if (orders.length === 0) {
      container.innerHTML = '';
      if (emptyMsg) emptyMsg.style.display = 'block';
      return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';

    container.innerHTML = orders.map(order => renderOrderCard(order)).join('');
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error"><i class="fas fa-exclamation-circle"></i> ${err.message}</div>`;
  }
}

function renderOrderCard(order) {
  const statusClass = {
    Pending: 'status-pending',
    Processing: 'status-processing',
    Shipped: 'status-shipped',
    Delivered: 'status-delivered',
    Cancelled: 'status-cancelled'
  }[order.orderStatus] || 'status-pending';

  const images = order.orderItems?.slice(0, 4).map(item => `
    <div class="order-item-thumb">
      <img src="${getImageUrl(item.image || item.product?.images?.[0]) || 'https://placehold.co/48x48?text=?'}"
           alt="${item.name}" onerror="this.src='https://placehold.co/48x48?text=?'">
    </div>
  `).join('') || '';

  const extraCount = (order.orderItems?.length || 0) - 4;

  return `
    <div class="order-card fade-in">
      <div class="order-card-header">
        <div>
          <div class="order-id">Order <strong>#${order._id.slice(-8).toUpperCase()}</strong></div>
          <div class="order-date"><i class="fas fa-calendar" style="margin-right:0.3rem"></i>${formatDate(order.createdAt)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap">
          <span class="order-status-badge ${statusClass}">
            <i class="fas fa-circle" style="font-size:0.5rem;margin-right:0.3rem"></i>${order.orderStatus}
          </span>
          ${order.isPaid
            ? '<span style="font-size:0.78rem;color:var(--success);font-weight:600"><i class="fas fa-check-circle"></i> Paid</span>'
            : '<span style="font-size:0.78rem;color:var(--warning);font-weight:600"><i class="fas fa-clock"></i> Unpaid</span>'}
        </div>
      </div>
      <div class="order-card-body">
        <div class="order-items-preview">
          ${images}
          ${extraCount > 0 ? `<div class="order-item-thumb" style="display:flex;align-items:center;justify-content:center;background:var(--surface-alt);font-size:0.75rem;font-weight:700;color:var(--text-muted)">+${extraCount}</div>` : ''}
        </div>
        <div class="order-meta-row">
          <div>
            <div class="order-total-label">${order.orderItems?.length || 0} item${(order.orderItems?.length || 0) !== 1 ? 's' : ''} · ${order.paymentMethod}</div>
            <div class="order-total-amount">${formatPrice(order.totalPrice)}</div>
          </div>
          <button class="btn btn-outline btn-sm" onclick="viewOrderDetails('${order._id}')">
            <i class="fas fa-eye"></i> View Details
          </button>
        </div>
      </div>
    </div>`;
}

async function viewOrderDetails(orderId) {
  const modal = document.getElementById('orderDetailModal');
  const body = document.getElementById('orderDetailBody');
  if (!modal || !body) return;

  body.innerHTML = `<div class="loading-overlay" style="padding:2rem"><div class="spinner"></div><p>Loading...</p></div>`;
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';

  try {
    const data = await Orders.getOne(orderId);
    const o = data.order;

    const statusClass = { Pending: 'status-pending', Processing: 'status-processing', Shipped: 'status-shipped', Delivered: 'status-delivered', Cancelled: 'status-cancelled' }[o.orderStatus] || '';

    body.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.5rem;margin-bottom:1.25rem">
        <div>
          <div style="font-size:0.82rem;color:var(--text-muted)">Order #${o._id.slice(-8).toUpperCase()}</div>
          <div style="font-size:0.82rem;color:var(--text-muted)">${formatDate(o.createdAt)}</div>
        </div>
        <span class="order-status-badge ${statusClass}">${o.orderStatus}</span>
      </div>

      <h4 style="font-size:0.9rem;margin-bottom:0.75rem;color:var(--text-muted)">Items Ordered</h4>
      ${o.orderItems.map(item => `
        <div class="order-review-item">
          <div class="order-review-img">
            <img src="${getImageUrl(item.image) || 'https://placehold.co/52x52?text=?'}" alt="${item.name}" onerror="this.src='https://placehold.co/52x52?text=?'">
          </div>
          <div class="order-review-name">
            ${item.name}
            <div class="order-review-qty">Qty: ${item.quantity} × ${formatPrice(item.price)}</div>
          </div>
          <div class="order-review-price">${formatPrice(item.price * item.quantity)}</div>
        </div>`).join('')}

      <div style="border-top:1px solid var(--border);padding-top:1rem;margin-top:1rem">
        <h4 style="font-size:0.9rem;margin-bottom:0.75rem;color:var(--text-muted)">Shipping Address</h4>
        <p style="font-size:0.88rem;color:var(--text-muted)">
          ${o.shippingAddress.street}, ${o.shippingAddress.city}, ${o.shippingAddress.state} ${o.shippingAddress.zipCode}, ${o.shippingAddress.country}
        </p>
      </div>

      <div style="border-top:1px solid var(--border);padding-top:1rem;margin-top:1rem">
        <div class="summary-row"><span>Subtotal</span><span>${formatPrice(o.itemsPrice)}</span></div>
        <div class="summary-row"><span>Shipping</span><span>${formatPrice(o.shippingPrice)}</span></div>
        <div class="summary-row"><span>Tax</span><span>${formatPrice(o.taxPrice)}</span></div>
        <div class="summary-row total"><span>Total</span><span>${formatPrice(o.totalPrice)}</span></div>
      </div>

      <div style="border-top:1px solid var(--border);padding-top:1rem;margin-top:1rem;display:flex;justify-content:space-between;font-size:0.85rem;color:var(--text-muted)">
        <span>Payment: ${o.paymentMethod}</span>
        <span>${o.isPaid ? '✅ Paid' : '⏳ Pending'}</span>
      </div>
    `;
  } catch (err) {
    body.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

function closeOrderModal() {
  const modal = document.getElementById('orderDetailModal');
  if (modal) modal.classList.remove('show');
  document.body.style.overflow = '';
}
