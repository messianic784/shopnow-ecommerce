/* ═══════════════════════════════════════════════════════════
   Admin.js - Admin dashboard shared logic & page controllers
═══════════════════════════════════════════════════════════ */

/* ── Admin Navbar / Sidebar ────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (!requireAdmin()) return;

  initAdminSidebar();
  initDarkModeToggle();
  loadAdminUser();

  const page = document.body.dataset.adminPage;
  if (page === 'dashboard') initDashboard();
  if (page === 'products') initAdminProducts();
  if (page === 'users') initAdminUsers();
  if (page === 'orders') initAdminOrders();
});

function initAdminSidebar() {
  const sidebar = document.getElementById('adminSidebar');
  const toggle = document.getElementById('sidebarToggle');
  const overlay = document.getElementById('sidebarOverlay');
  const main = document.getElementById('adminMain');

  if (!sidebar) return;

  toggle?.addEventListener('click', () => {
    const isOpen = sidebar.classList.contains('open') || !sidebar.classList.contains('collapsed');
    if (window.innerWidth <= 900) {
      sidebar.classList.toggle('open');
      overlay?.classList.toggle('show');
    } else {
      sidebar.classList.toggle('collapsed');
      main?.classList.toggle('expanded');
    }
  });

  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  });
}

function initDarkModeToggle() {
  const btn = document.getElementById('adminDarkToggle');
  if (!btn) return;
  btn.innerHTML = `<i class="fas ${document.body.classList.contains('dark') ? 'fa-sun' : 'fa-moon'}"></i>`;
  btn.addEventListener('click', () => {
    toggleDarkMode();
    btn.innerHTML = `<i class="fas ${document.body.classList.contains('dark') ? 'fa-sun' : 'fa-moon'}"></i>`;
  });
}

function loadAdminUser() {
  const user = getCurrentUser();
  if (!user) return;
  document.querySelectorAll('.admin-user-name').forEach(el => el.textContent = user.name);
  document.querySelectorAll('.admin-user-avatar').forEach(el => el.textContent = user.name.charAt(0).toUpperCase());
}

/* ── Dashboard ─────────────────────────────────────────────── */
async function initDashboard() {
  try {
    const data = await Admin.stats();
    const stats = data.stats;

    setText('statUsers', formatNumber(stats.totalUsers));
    setText('statProducts', formatNumber(stats.totalProducts));
    setText('statOrders', formatNumber(stats.totalOrders));
    setText('statRevenue', formatPrice(stats.totalRevenue));

    renderOrderStatusChart(stats.ordersByStatus);
    renderSalesChart(stats.monthlySales);
    renderRecentOrders(stats.recentOrders);
    renderTopProducts(stats.topProducts);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderOrderStatusChart(statusData) {
  const container = document.getElementById('orderStatusChart');
  if (!container) return;
  const colors = { Pending: '#f59e0b', Processing: '#3b82f6', Shipped: '#8b5cf6', Delivered: '#10b981', Cancelled: '#ef4444' };
  const total = statusData.reduce((s, d) => s + d.count, 0);

  container.innerHTML = `
    <div class="donut-wrap">
      <svg viewBox="0 0 120 120" width="120" height="120">
        ${buildDonutSegments(statusData, total, colors)}
        <circle cx="60" cy="60" r="30" fill="var(--surface)"/>
        <text x="60" y="57" text-anchor="middle" font-size="14" font-weight="700" fill="var(--text)">${total}</text>
        <text x="60" y="70" text-anchor="middle" font-size="8" fill="var(--text-muted)">Orders</text>
      </svg>
      <div class="donut-legend">
        ${statusData.map(d => `
          <div class="legend-item">
            <div class="legend-dot" style="background:${colors[d._id] || '#94a3b8'}"></div>
            <span style="color:var(--text-muted);font-size:0.82rem">${d._id}: <strong style="color:var(--text)">${d.count}</strong></span>
          </div>`).join('')}
      </div>
    </div>`;
}

function buildDonutSegments(data, total, colors) {
  if (total === 0) return '<circle cx="60" cy="60" r="40" fill="var(--border)"/>';
  const r = 40; const cx = 60; const cy = 60;
  let startAngle = -90;
  return data.map(d => {
    const angle = (d.count / total) * 360;
    const endAngle = startAngle + angle;
    const x1 = cx + r * Math.cos((startAngle * Math.PI) / 180);
    const y1 = cy + r * Math.sin((startAngle * Math.PI) / 180);
    const x2 = cx + r * Math.cos((endAngle * Math.PI) / 180);
    const y2 = cy + r * Math.sin((endAngle * Math.PI) / 180);
    const largeArc = angle > 180 ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    startAngle = endAngle;
    return `<path d="${path}" fill="${colors[d._id] || '#94a3b8'}"/>`;
  }).join('');
}

function renderSalesChart(monthlyData) {
  const container = document.getElementById('salesChart');
  if (!container) return;
  const maxSales = Math.max(...monthlyData.map(m => m.sales), 1);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  container.innerHTML = `
    <div class="mini-chart">
      ${monthlyData.map(m => {
        const pct = Math.max(4, (m.sales / maxSales) * 100);
        return `<div class="mini-bar-wrap">
          <div class="mini-bar" style="height:${pct}%" title="${months[m._id.month - 1]}: ${formatPrice(m.sales)}"></div>
          <span class="mini-label">${months[m._id.month - 1]}</span>
        </div>`;
      }).join('')}
    </div>
    <div style="margin-top:0.5rem;font-size:0.78rem;color:var(--text-muted);text-align:right">Last 6 months revenue</div>`;
}

function renderRecentOrders(orders) {
  const tbody = document.getElementById('recentOrdersTbody');
  if (!tbody) return;
  if (!orders.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">No orders yet</td></tr>'; return; }

  tbody.innerHTML = orders.map(o => {
    const cls = { Pending: 'status-pending', Processing: 'status-processing', Shipped: 'status-shipped', Delivered: 'status-delivered', Cancelled: 'status-cancelled' }[o.orderStatus] || '';
    return `<tr>
      <td><span style="font-weight:600;font-size:0.82rem">#${o._id.slice(-8).toUpperCase()}</span></td>
      <td>${o.user?.name || 'Unknown'}</td>
      <td>${formatDate(o.createdAt)}</td>
      <td>${formatPrice(o.totalPrice)}</td>
      <td><span class="order-status-badge ${cls}">${o.orderStatus}</span></td>
    </tr>`;
  }).join('');
}

function renderTopProducts(products) {
  const tbody = document.getElementById('topProductsTbody');
  if (!tbody) return;
  if (!products.length) { tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--text-muted)">No data yet</td></tr>'; return; }
  tbody.innerHTML = products.map((p, i) => `
    <tr>
      <td><span style="font-weight:700;color:var(--primary)">#${i + 1}</span></td>
      <td style="font-weight:600">${p._id}</td>
      <td>${formatNumber(p.totalSold)} sold</td>
    </tr>`).join('');
}

/* ── Admin Products Page ───────────────────────────────────── */
let productPage = 1;
let editingProductId = null;

async function initAdminProducts() {
  await loadAdminProductsTable();
  initProductModal();
}

async function loadAdminProductsTable(page = 1, search = '') {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem"><div class="spinner" style="margin:0 auto"></div></td></tr>`;
  productPage = page;

  try {
    const params = { page, limit: 15 };
    if (search) params.search = search;
    const data = await Admin.getProducts(params);
    renderProductsTable(data.products, data.total, data.totalPages, page);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="alert alert-error">${err.message}</div></td></tr>`;
  }
}

function renderProductsTable(products, total, totalPages, page) {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;

  if (!products.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted)">No products found</td></tr>'; return; }

  tbody.innerHTML = products.map(p => `
    <tr>
      <td><div class="product-thumb-sm">
        <img src="${getImageUrl(p.images?.[0]) || 'https://placehold.co/44x44?text=?'}" alt="${p.name}" onerror="this.src='https://placehold.co/44x44?text=?'">
        <div><div class="name">${p.name}</div><div class="brand">${p.brand || '—'}</div></div>
      </div></td>
      <td>${p.category}</td>
      <td>${formatPrice(p.price)}</td>
      <td>
        <span class="stock-dot ${p.stock === 0 ? 'out' : p.stock <= 5 ? 'low' : 'in'}"></span>
        ${p.stock}
      </td>
      <td>${renderStars(p.ratings)} (${p.numReviews})</td>
      <td>
        <label class="toggle-switch" style="pointer-events:none">
          <input type="checkbox" ${p.isActive ? 'checked' : ''} disabled>
          <span class="toggle-slider"></span>
        </label>
      </td>
      <td>
        <div class="action-btns">
          <button class="action-btn edit" onclick="openEditProduct('${p._id}')" title="Edit"><i class="fas fa-pen"></i></button>
          <button class="action-btn delete" onclick="deleteProduct('${p._id}', '${p.name.replace(/'/g,"\\'")}');" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');

  renderAdminPagination('productsPagination', page, totalPages, (p) => loadAdminProductsTable(p));
  setText('productCount', `${total} products`);
}

function initProductModal() {
  const form = document.getElementById('productForm');
  if (!form) return;

  document.getElementById('addProductBtn')?.addEventListener('click', () => openAddProduct());
  document.getElementById('productModalClose')?.addEventListener('click', closeProductModal);
  document.getElementById('productModalOverlay')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeProductModal(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate required fields manually (form has novalidate to avoid
    // browser tooltips being hidden inside the scrollable modal container)
    const name = document.getElementById('pf_name')?.value.trim();
    const description = document.getElementById('pf_description')?.value.trim();
    const category = document.getElementById('pf_category')?.value;
    const price = document.getElementById('pf_price')?.value;
    const stock = document.getElementById('pf_stock')?.value;

    if (!name || !description || !category || !price || !stock) {
      showToast('Please fill in all required fields: Name, Description, Category, Price, and Stock.', 'warning');
      // Scroll the modal back to the top so the user can see the empty fields
      form.closest('.modal').scrollTop = 0;
      return;
    }

    // The button lives outside the <form> element, so querySelector on the
    // form itself returns null — use getElementById to reach it directly.
    const btn = document.getElementById('productSubmitBtn');
    // Capture edit mode now — closeProductModal() will null editingProductId
    // before the finally block runs, making the check unreliable there.
    const isEditing = !!editingProductId;
    btn.disabled = true; btn.innerHTML = '<span class="spinner spinner-sm"></span> Saving...';

    const formData = new FormData();
    const fields = ['name', 'description', 'category', 'brand', 'price', 'originalPrice', 'stock', 'tags'];
    fields.forEach(f => { const el = document.getElementById(`pf_${f}`); if (el) formData.append(f, el.value); });
    formData.append('featured', document.getElementById('pf_featured')?.checked ? 'true' : 'false');
    formData.append('isActive', document.getElementById('pf_isActive')?.checked ? 'true' : 'false');

    const fileInput = document.getElementById('pf_images');
    if (fileInput?.files.length) {
      Array.from(fileInput.files).forEach(f => formData.append('images', f));
    }

    try {
      if (editingProductId) {
        await Admin.updateProduct(editingProductId, formData);
        showToast('Product updated successfully!', 'success');
      } else {
        await Admin.createProduct(formData);
        showToast('Product created successfully!', 'success');
      }
      closeProductModal();
      await loadAdminProductsTable(productPage);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false; btn.innerHTML = isEditing ? '<i class="fas fa-save"></i> Update Product' : '<i class="fas fa-plus"></i> Create Product';
    }
  });

  // Image preview
  document.getElementById('pf_images')?.addEventListener('change', function () {
    const preview = document.getElementById('imagePreviewGrid');
    if (!preview) return;
    preview.innerHTML = '';
    Array.from(this.files).slice(0, 5).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const div = document.createElement('div');
        div.className = 'img-preview';
        div.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        preview.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
  });
}

function openAddProduct() {
  editingProductId = null;
  document.getElementById('productModalTitle').textContent = 'Add New Product';
  document.getElementById('productSubmitBtn').innerHTML = '<i class="fas fa-plus"></i> Create Product';
  document.getElementById('productForm')?.reset();
  document.getElementById('imagePreviewGrid').innerHTML = '';
  document.getElementById('productModalOverlay').classList.add('show');
  document.body.style.overflow = 'hidden';
}

async function openEditProduct(id) {
  try {
    const data = await Products.getOne(id);
    const p = data.product;
    editingProductId = id;

    document.getElementById('productModalTitle').textContent = 'Edit Product';
    document.getElementById('productSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Update Product';

    const setVal = (fid, val) => { const el = document.getElementById(fid); if (el) el.value = val; };
    setVal('pf_name', p.name);
    setVal('pf_description', p.description);
    setVal('pf_category', p.category);
    setVal('pf_brand', p.brand || '');
    setVal('pf_price', p.price);
    setVal('pf_originalPrice', p.originalPrice || '');
    setVal('pf_stock', p.stock);
    setVal('pf_tags', p.tags?.join(', ') || '');

    const featuredEl = document.getElementById('pf_featured');
    const activeEl = document.getElementById('pf_isActive');
    if (featuredEl) featuredEl.checked = p.featured;
    if (activeEl) activeEl.checked = p.isActive;

    // Show existing images
    const preview = document.getElementById('imagePreviewGrid');
    if (preview && p.images?.length) {
      preview.innerHTML = p.images.map(img => `<div class="img-preview"><img src="${getImageUrl(img)}" alt="Product"></div>`).join('');
    }

    document.getElementById('productModalOverlay').classList.add('show');
    document.body.style.overflow = 'hidden';
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function closeProductModal() {
  document.getElementById('productModalOverlay')?.classList.remove('show');
  document.body.style.overflow = '';
  editingProductId = null;
}

async function deleteProduct(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
  try {
    await Admin.deleteProduct(id);
    showToast('Product deleted successfully', 'success');
    await loadAdminProductsTable(productPage);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ── Admin Users Page ──────────────────────────────────────── */
let usersPage = 1;

async function initAdminUsers() {
  await loadAdminUsersTable();
}

async function loadAdminUsersTable(page = 1) {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem"><div class="spinner" style="margin:0 auto"></div></td></tr>`;
  usersPage = page;

  try {
    const data = await Admin.getUsers({ page, limit: 20 });
    renderUsersTable(data.users, data.total, data.totalPages, page);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="alert alert-error">${err.message}</div></td></tr>`;
  }
}

function renderUsersTable(users, total, totalPages, page) {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  if (!users.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted)">No users found</td></tr>'; return; }

  tbody.innerHTML = users.map(u => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:0.6rem">
          <div style="width:34px;height:34px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;flex-shrink:0">${u.name.charAt(0).toUpperCase()}</div>
          <div>
            <div style="font-weight:600;font-size:0.88rem">${u.name}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">${u.email}</div>
          </div>
        </div>
      </td>
      <td><span style="padding:0.2rem 0.6rem;border-radius:9999px;font-size:0.75rem;font-weight:700;background:${u.role === 'admin' ? 'rgba(79,70,229,0.1)' : 'rgba(16,185,129,0.1)'};color:${u.role === 'admin' ? 'var(--primary)' : 'var(--success)'}">${u.role}</span></td>
      <td>${u.phone || '—'}</td>
      <td>${formatDate(u.createdAt)}</td>
      <td>
        <label class="toggle-switch" onclick="toggleUserStatus('${u._id}', ${!u.isActive}, this)">
          <input type="checkbox" ${u.isActive ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </td>
      <td>
        <div class="action-btns">
          <button class="action-btn edit" onclick="toggleUserRole('${u._id}', '${u.role}')" title="${u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}">
            <i class="fas fa-${u.role === 'admin' ? 'user-minus' : 'user-shield'}"></i>
          </button>
          <button class="action-btn delete" onclick="deleteUser('${u._id}', '${u.name.replace(/'/g,"\\'")}');" title="Delete user">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>`).join('');

  renderAdminPagination('usersPagination', page, totalPages, (p) => loadAdminUsersTable(p));
  setText('userCount', `${total} users`);
}

async function toggleUserStatus(id, isActive, toggleEl) {
  try {
    await Admin.updateUser(id, { isActive });
    showToast(`User ${isActive ? 'activated' : 'deactivated'}`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
    const checkbox = toggleEl.querySelector('input');
    if (checkbox) checkbox.checked = !isActive;
  }
}

async function toggleUserRole(id, currentRole) {
  const newRole = currentRole === 'admin' ? 'user' : 'admin';
  if (!confirm(`Change this user's role to ${newRole}?`)) return;
  try {
    await Admin.updateUser(id, { role: newRole });
    showToast(`User role updated to ${newRole}`, 'success');
    await loadAdminUsersTable(usersPage);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteUser(id, name) {
  if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
  try {
    await Admin.deleteUser(id);
    showToast('User deleted', 'success');
    await loadAdminUsersTable(usersPage);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ── Admin Orders Page ─────────────────────────────────────── */
let ordersPage = 1;

async function initAdminOrders() {
  await loadAdminOrdersTable();

  document.getElementById('orderStatusFilter')?.addEventListener('change', function () {
    loadAdminOrdersTable(1, this.value);
  });
}

async function loadAdminOrdersTable(page = 1, status = '') {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem"><div class="spinner" style="margin:0 auto"></div></td></tr>`;
  ordersPage = page;

  try {
    const params = { page, limit: 20 };
    if (status) params.status = status;
    const data = await Admin.getOrders(params);
    renderOrdersTable(data.orders, data.total, data.totalPages, page);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="alert alert-error">${err.message}</div></td></tr>`;
  }
}

function renderOrdersTable(orders, total, totalPages, page) {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  if (!orders.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted)">No orders found</td></tr>'; return; }

  const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  tbody.innerHTML = orders.map(o => {
    const cls = { Pending: 'status-pending', Processing: 'status-processing', Shipped: 'status-shipped', Delivered: 'status-delivered', Cancelled: 'status-cancelled' }[o.orderStatus] || '';
    return `<tr>
      <td><span style="font-weight:600;font-size:0.82rem">#${o._id.slice(-8).toUpperCase()}</span></td>
      <td><div style="font-size:0.88rem;font-weight:600">${o.user?.name || 'Unknown'}</div><div style="font-size:0.75rem;color:var(--text-muted)">${o.user?.email || ''}</div></td>
      <td>${formatDate(o.createdAt)}</td>
      <td>${o.orderItems?.length || 0} items</td>
      <td>${formatPrice(o.totalPrice)}</td>
      <td>
        <select class="form-control" style="padding:0.3rem 0.5rem;font-size:0.8rem;width:130px" onchange="updateOrderStatus('${o._id}', this.value)">
          ${statuses.map(s => `<option value="${s}" ${s === o.orderStatus ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
      <td>${o.isPaid ? '<span style="color:var(--success);font-size:0.8rem;font-weight:600"><i class="fas fa-check-circle"></i> Paid</span>' : '<span style="color:var(--warning);font-size:0.8rem"><i class="fas fa-clock"></i> Pending</span>'}</td>
    </tr>`;
  }).join('');

  renderAdminPagination('ordersPagination', page, totalPages, (p) => loadAdminOrdersTable(p));
  setText('orderCount', `${total} orders`);
}

async function updateOrderStatus(id, status) {
  try {
    await Admin.updateOrder(id, { orderStatus: status });
    showToast(`Order status updated to ${status}`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
    await loadAdminOrdersTable(ordersPage);
  }
}

/* ── Shared Utilities ──────────────────────────────────────── */
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

function renderAdminPagination(containerId, current, total, callback) {
  const container = document.getElementById(containerId);
  if (!container || total <= 1) { if (container) container.innerHTML = ''; return; }

  let html = `<button class="page-btn" ${current === 1 ? 'disabled' : ''} onclick="(${callback})(${current - 1})"><i class="fas fa-chevron-left"></i></button>`;
  for (let i = 1; i <= Math.min(total, 5); i++) {
    html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="(${callback})(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" ${current === total ? 'disabled' : ''} onclick="(${callback})(${current + 1})"><i class="fas fa-chevron-right"></i></button>`;
  container.innerHTML = html;
}

// Search debounce
document.addEventListener('DOMContentLoaded', () => {
  const adminSearchInput = document.getElementById('adminProductSearch');
  if (adminSearchInput) {
    adminSearchInput.addEventListener('input', debounce(() => {
      loadAdminProductsTable(1, adminSearchInput.value.trim());
    }, 400));
  }
});
