/* ═══════════════════════════════════════════════════════════
   Main.js - Shared functionality across all pages
═══════════════════════════════════════════════════════════ */

/* ── Dark Mode ─────────────────────────────────────────────── */
(function initDarkMode() {
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
  }
})();

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', isDark);
  updateDarkToggleIcon();
}

function updateDarkToggleIcon() {
  const toggles = document.querySelectorAll('.dark-toggle');
  const isDark = document.body.classList.contains('dark');
  toggles.forEach(btn => {
    const icon = btn.querySelector('i');
    if (icon) {
      icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
  });
}

/* ── Auth State ────────────────────────────────────────────── */
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

function getToken() {
  return localStorage.getItem('token');
}

function isLoggedIn() {
  return !!getToken() && !!getCurrentUser();
}

function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === 'admin';
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('cart');
  window.location.href = '/frontend/login.html';
}

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = `/frontend/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    return false;
  }
  return true;
}

function requireAdmin() {
  if (!isLoggedIn() || !isAdmin()) {
    window.location.href = '/frontend/login.html?redirect=/frontend/admin/dashboard.html';
    return false;
  }
  return true;
}

/* ── Toast Notifications ───────────────────────────────────── */
let toastContainer = null;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toastContainer';
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
  }
  return toastContainer;
}

function showToast(message, type = 'info', title = null, duration = 3500) {
  const container = getToastContainer();
  const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
  const titles = { success: 'Success', error: 'Error', warning: 'Warning', info: 'Info' };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fas ${icons[type]} toast-icon"></i>
    <div class="toast-body">
      <div class="toast-title">${title || titles[type]}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => { requestAnimationFrame(() => toast.classList.add('show')); });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

/* ── Cart Helpers ──────────────────────────────────────────── */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

function updateCartBadge() {
  const count = getCartCount();
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

function addToCart(product, quantity = 1) {
  const cart = getCart();
  const idx = cart.findIndex(i => i._id === product._id);

  if (idx > -1) {
    cart[idx].quantity = Math.min(cart[idx].quantity + quantity, product.stock || 99);
  } else {
    cart.push({
      _id: product._id,
      name: product.name,
      price: product.price,
      image: getImageUrl(product.images?.[0]),
      stock: product.stock,
      quantity
    });
  }

  saveCart(cart);
  showToast(`${product.name} added to cart`, 'success');
  return true;
}

function removeFromCart(productId) {
  const cart = getCart().filter(i => i._id !== productId);
  saveCart(cart);
}

function updateCartQuantity(productId, quantity) {
  const cart = getCart();
  const idx = cart.findIndex(i => i._id === productId);
  if (idx > -1) {
    if (quantity <= 0) {
      cart.splice(idx, 1);
    } else {
      cart[idx].quantity = Math.min(quantity, cart[idx].stock || 99);
    }
    saveCart(cart);
  }
}

function clearCart() {
  saveCart([]);
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/* ── Wishlist Helpers ──────────────────────────────────────── */
function getLocalWishlist() {
  try {
    return JSON.parse(localStorage.getItem('wishlist') || '[]');
  } catch {
    return [];
  }
}

function isInWishlist(productId) {
  return getLocalWishlist().includes(productId);
}

function updateWishlistBadge() {
  const count = getLocalWishlist().length;
  document.querySelectorAll('.wishlist-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

async function toggleWishlistItem(productId, btn = null) {
  if (!isLoggedIn()) {
    showToast('Please login to manage your wishlist', 'warning');
    return;
  }

  try {
    const data = await Users.toggleWishlist(productId);
    const wishlist = getLocalWishlist();
    const idx = wishlist.indexOf(productId);

    if (idx > -1) {
      wishlist.splice(idx, 1);
    } else {
      wishlist.push(productId);
    }

    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistBadge();

    if (btn) {
      btn.classList.toggle('active', data.inWishlist);
      const icon = btn.querySelector('i');
      if (icon) icon.className = data.inWishlist ? 'fas fa-heart' : 'far fa-heart';
    }

    showToast(data.message, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ── Number / Currency Formatting ──────────────────────────── */
function formatPrice(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(dateStr) {
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(dateStr));
}

function formatNumber(n) {
  return new Intl.NumberFormat('en-US').format(n);
}

function getDiscount(price, originalPrice) {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

/* ── Star Rating HTML ──────────────────────────────────────── */
function renderStars(rating, max = 5) {
  let html = '';
  for (let i = 1; i <= max; i++) {
    if (i <= Math.floor(rating)) html += '<i class="fas fa-star"></i>';
    else if (i - 0.5 <= rating) html += '<i class="fas fa-star-half-alt"></i>';
    else html += '<i class="far fa-star"></i>';
  }
  return html;
}

/* ── Debounce ──────────────────────────────────────────────── */
function debounce(fn, delay = 350) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* ── Navbar Builder ────────────────────────────────────────── */
function buildNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  const user = getCurrentUser();
  const cartCount = getCartCount();
  const wishCount = getLocalWishlist().length;
  const isDark = document.body.classList.contains('dark');

  nav.innerHTML = `
    <div class="container">
      <a href="/frontend/index.html" class="nav-brand">
        <i class="fas fa-shopping-bag"></i>
        <span>ShopNow</span>
      </a>

      <div class="nav-search">
        <i class="fas fa-search search-icon"></i>
        <input type="text" id="navSearch" placeholder="Search products..." autocomplete="off">
        <button class="search-btn" id="navSearchBtn">Search</button>
      </div>

      <nav class="nav-actions">
        <button class="dark-toggle" id="darkToggle" title="Toggle dark mode">
          <i class="fas ${isDark ? 'fa-sun' : 'fa-moon'}"></i>
        </button>

        <a href="/frontend/wishlist.html" class="nav-btn" title="Wishlist">
          <i class="far fa-heart"></i>
          <span class="badge wishlist-badge" style="display:${wishCount > 0 ? 'flex' : 'none'}">${wishCount}</span>
        </a>

        <a href="/frontend/cart.html" class="nav-btn" title="Cart">
          <i class="fas fa-shopping-cart"></i>
          <span class="badge cart-badge" style="display:${cartCount > 0 ? 'flex' : 'none'}">${cartCount}</span>
        </a>

        ${user ? `
          <div class="nav-user" id="navUser">
            <button class="nav-user-btn" id="navUserBtn">
              <div class="avatar">${user.name.charAt(0).toUpperCase()}</div>
              <span class="btn-text">${user.name.split(' ')[0]}</span>
              <i class="fas fa-chevron-down" style="font-size:0.7rem;opacity:0.7"></i>
            </button>
            <div class="nav-dropdown" id="navDropdown">
              ${user.role === 'admin' ? `<a href="/frontend/admin/dashboard.html"><i class="fas fa-tachometer-alt"></i> Admin Panel</a><hr class="divider">` : ''}
              <a href="/frontend/profile.html"><i class="fas fa-user"></i> My Profile</a>
              <a href="/frontend/orders.html"><i class="fas fa-box"></i> My Orders</a>
              <a href="/frontend/wishlist.html"><i class="far fa-heart"></i> Wishlist</a>
              <hr class="divider">
              <button onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</button>
            </div>
          </div>
        ` : `
          <a href="/frontend/login.html" class="btn btn-outline btn-sm">Login</a>
          <a href="/frontend/register.html" class="btn btn-primary btn-sm btn-text">Sign Up</a>
        `}
      </nav>

      <button class="hamburger" id="hamburger">
        <span></span><span></span><span></span>
      </button>
    </div>
  `;

  // Dark mode toggle
  const darkToggle = document.getElementById('darkToggle');
  if (darkToggle) darkToggle.addEventListener('click', toggleDarkMode);

  // Search
  const navSearch = document.getElementById('navSearch');
  const navSearchBtn = document.getElementById('navSearchBtn');

  function doSearch() {
    const q = navSearch.value.trim();
    if (q) window.location.href = `/frontend/products.html?search=${encodeURIComponent(q)}`;
  }

  if (navSearchBtn) navSearchBtn.addEventListener('click', doSearch);
  if (navSearch) {
    navSearch.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
    // Pre-fill search from URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('search')) navSearch.value = params.get('search');
  }

  // User dropdown
  const navUserBtn = document.getElementById('navUserBtn');
  const navDropdown = document.getElementById('navDropdown');
  if (navUserBtn && navDropdown) {
    navUserBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navDropdown.classList.toggle('show');
    });
    document.addEventListener('click', () => navDropdown.classList.remove('show'));
  }

  updateCartBadge();
  updateWishlistBadge();
}

/* ── Footer Builder ────────────────────────────────────────── */
function buildFooter() {
  const footer = document.getElementById('footer');
  if (!footer) return;

  footer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <h3><i class="fas fa-shopping-bag"></i> ShopNow</h3>
          <p>Your one-stop shop for everything you need. Quality products, great prices, fast delivery.</p>
          <div class="footer-social">
            <a href="#" title="Facebook"><i class="fab fa-facebook-f"></i></a>
            <a href="#" title="Twitter"><i class="fab fa-twitter"></i></a>
            <a href="#" title="Instagram"><i class="fab fa-instagram"></i></a>
            <a href="#" title="YouTube"><i class="fab fa-youtube"></i></a>
          </div>
        </div>
        <div class="footer-col">
          <h4>Shop</h4>
          <ul>
            <li><a href="/frontend/products.html">All Products</a></li>
            <li><a href="/frontend/products.html?category=Electronics">Electronics</a></li>
            <li><a href="/frontend/products.html?category=Clothing">Clothing</a></li>
            <li><a href="/frontend/products.html?category=Books">Books</a></li>
            <li><a href="/frontend/products.html?featured=true">Featured</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Account</h4>
          <ul>
            <li><a href="/frontend/profile.html">My Profile</a></li>
            <li><a href="/frontend/orders.html">My Orders</a></li>
            <li><a href="/frontend/wishlist.html">Wishlist</a></li>
            <li><a href="/frontend/cart.html">Shopping Cart</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Support</h4>
          <ul>
            <li><a href="#">Help Center</a></li>
            <li><a href="#">Returns Policy</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">Contact Us</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} ShopNow. All rights reserved.</p>
        <div class="footer-payments">
          <span class="payment-icon">VISA</span>
          <span class="payment-icon">MC</span>
          <span class="payment-icon">PAYPAL</span>
          <span class="payment-icon">AMEX</span>
        </div>
      </div>
    </div>
  `;
}

/* ── Scroll to Top ─────────────────────────────────────────── */
function initScrollTop() {
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.style.display = window.scrollY > 400 ? 'flex' : 'none';
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ── Init ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  buildNavbar();
  buildFooter();
  initScrollTop();
  updateDarkToggleIcon();
});
