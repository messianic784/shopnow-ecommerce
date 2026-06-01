/* ═══════════════════════════════════════════════════════════
   Products.js - Product listing page logic
═══════════════════════════════════════════════════════════ */

let currentPage = 1;
let currentParams = {};
let totalPages = 1;

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadCategories(), loadProducts()]);
  initFilters();
});

/* ── Load Categories ──────────────────────────────────────── */
async function loadCategories() {
  const container = document.getElementById('categoryFilters');
  if (!container) return;
  try {
    const data = await Products.getCategories();
    const cats = data.categories || [];
    const current = getParams().category || '';
    container.innerHTML = cats.map(cat => `
      <label class="filter-option">
        <input type="radio" name="category" value="${cat}" ${current === cat ? 'checked' : ''} onchange="applyFilter('category', this.value)">
        <span>${cat}</span>
      </label>
    `).join('') + `<label class="filter-option">
      <input type="radio" name="category" value="" ${!current ? 'checked' : ''} onchange="applyFilter('category', '')">
      <span>All Categories</span>
    </label>`;
  } catch (_) {}
}

/* ── Load Products ────────────────────────────────────────── */
async function loadProducts(page = 1) {
  const container = document.getElementById('productsGrid');
  const countEl = document.getElementById('resultsCount');
  if (!container) return;

  container.innerHTML = renderSkeletons(12);
  currentPage = page;

  const params = buildParams(page);

  try {
    const data = await Products.getAll(params);
    totalPages = data.totalPages || 1;

    if (countEl) countEl.textContent = `${data.total || 0} products found`;

    if (!data.products || data.products.length === 0) {
      container.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:4rem 2rem;">
          <i class="fas fa-box-open" style="font-size:4rem;color:var(--text-light);margin-bottom:1rem;display:block"></i>
          <h3 style="color:var(--text-muted)">No products found</h3>
          <p style="color:var(--text-light);margin-top:0.5rem">Try adjusting your filters or search term</p>
          <button class="btn btn-outline btn-sm" onclick="clearAllFilters()" style="margin-top:1rem">Clear Filters</button>
        </div>`;
      renderPagination(0, 0);
      return;
    }

    const wishlist = getLocalWishlist();
    container.innerHTML = data.products.map(p => renderProductCard(p, wishlist)).join('');
    renderPagination(currentPage, totalPages);

  } catch (err) {
    container.innerHTML = `<div style="grid-column:1/-1"><div class="alert alert-error"><i class="fas fa-exclamation-circle"></i> ${err.message}</div></div>`;
  }
}

function renderProductCard(product, wishlist = []) {
  const discount = getDiscount(product.price, product.originalPrice);
  const inStock = product.stock > 0;
  const inWish = wishlist.includes(product._id);

  return `
    <div class="product-card fade-in">
      <div class="product-img-wrap">
        <a href="/frontend/product-detail.html?id=${product._id}">
          <img src="${getImageUrl(product.images?.[0]) || 'https://placehold.co/300x300?text=No+Image'}" alt="${product.name}" loading="lazy" onerror="this.src='https://placehold.co/300x300?text=No+Image'">
        </a>
        <div class="product-badges">
          ${discount > 0 ? `<span class="badge-sale">-${discount}%</span>` : ''}
          ${product.featured ? '<span class="badge-featured">Featured</span>' : ''}
          ${!inStock ? '<span class="badge-out">Out of Stock</span>' : ''}
        </div>
        <div class="product-actions">
          <button class="product-action-btn ${inWish ? 'active' : ''}" onclick="toggleWishlistItem('${product._id}', this)" title="${inWish ? 'Remove from wishlist' : 'Add to wishlist'}">
            <i class="${inWish ? 'fas' : 'far'} fa-heart"></i>
          </button>
          <a href="/frontend/product-detail.html?id=${product._id}" class="product-action-btn" title="View details">
            <i class="fas fa-eye"></i>
          </a>
        </div>
      </div>
      <div class="product-info">
        <div class="product-category">${product.category}</div>
        <h3 class="product-name">
          <a href="/frontend/product-detail.html?id=${product._id}">${product.name}</a>
        </h3>
        <div class="product-rating">
          <div class="stars">${renderStars(product.ratings || 0)}</div>
          <span class="rating-count">(${product.numReviews || 0})</span>
        </div>
        <div class="product-price">
          <span class="price-current">${formatPrice(product.price)}</span>
          ${product.originalPrice > product.price ? `<span class="price-original">${formatPrice(product.originalPrice)}</span>` : ''}
          ${discount > 0 ? `<span class="price-discount">-${discount}%</span>` : ''}
        </div>
        <button class="add-to-cart-btn" onclick="addToCartFromList(this, ${JSON.stringify(product).replace(/"/g, '&quot;')})" ${!inStock ? 'disabled' : ''}>
          <i class="fas fa-cart-plus"></i> ${inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  `;
}

function addToCartFromList(btn, product) {
  addToCart(product);
  btn.innerHTML = '<i class="fas fa-check"></i> Added!';
  btn.style.background = 'var(--success)';
  setTimeout(() => {
    btn.innerHTML = '<i class="fas fa-cart-plus"></i> Add to Cart';
    btn.style.background = '';
  }, 1500);
}

/* ── Filters ──────────────────────────────────────────────── */
function getParams() {
  const params = new URLSearchParams(window.location.search);
  const obj = {};
  for (const [k, v] of params.entries()) if (v) obj[k] = v;
  return obj;
}

function buildParams(page) {
  const p = getParams();
  p.page = page;
  p.limit = 12;
  return p;
}

function applyFilter(key, value) {
  const params = new URLSearchParams(window.location.search);
  if (value) params.set(key, value);
  else params.delete(key);
  params.delete('page');
  window.location.search = params.toString();
}

function clearAllFilters() {
  window.location.href = '/frontend/products.html';
}

function initFilters() {
  const params = getParams();

  // Sort
  const sortEl = document.getElementById('sortSelect');
  if (sortEl) {
    sortEl.value = params.sort || '';
    sortEl.addEventListener('change', () => applyFilter('sort', sortEl.value));
  }

  // Price range
  const minPrice = document.getElementById('minPrice');
  const maxPrice = document.getElementById('maxPrice');
  const applyPrice = document.getElementById('applyPrice');

  if (minPrice) minPrice.value = params.minPrice || '';
  if (maxPrice) maxPrice.value = params.maxPrice || '';

  if (applyPrice) {
    applyPrice.addEventListener('click', () => {
      const up = new URLSearchParams(window.location.search);
      if (minPrice.value) up.set('minPrice', minPrice.value);
      else up.delete('minPrice');
      if (maxPrice.value) up.set('maxPrice', maxPrice.value);
      else up.delete('maxPrice');
      up.delete('page');
      window.location.search = up.toString();
    });
  }

  // Active filter tags
  renderActiveFilters(params);

  // Pagination buttons
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  if (prevBtn) prevBtn.addEventListener('click', () => currentPage > 1 && loadProducts(currentPage - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => currentPage < totalPages && loadProducts(currentPage + 1));
}

function renderActiveFilters(params) {
  const container = document.getElementById('activeFilters');
  if (!container) return;
  const labels = { category: 'Category', search: 'Search', minPrice: 'Min Price', maxPrice: 'Max Price', sort: 'Sort', rating: 'Rating', featured: 'Featured' };
  const tags = Object.entries(params).filter(([k]) => k !== 'page' && k !== 'limit').map(([k, v]) => `
    <span class="filter-tag">${labels[k] || k}: ${v} <button onclick="applyFilter('${k}','')"><i class="fas fa-times"></i></button></span>
  `).join('');
  container.innerHTML = tags;
}

function renderPagination(current, total) {
  const container = document.getElementById('pagination');
  if (!container || total <= 1) { if (container) container.innerHTML = ''; return; }

  let html = `<button class="page-btn" onclick="loadProducts(${current - 1})" ${current === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 2 && i <= current + 2)) {
      html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="loadProducts(${i})">${i}</button>`;
    } else if (i === current - 3 || i === current + 3) {
      html += `<span style="color:var(--text-muted);padding:0 0.25rem;">…</span>`;
    }
  }

  html += `<button class="page-btn" onclick="loadProducts(${current + 1})" ${current === total ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;
  container.innerHTML = html;
}

function renderSkeletons(count) {
  return Array(count).fill('').map(() => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-img"></div>
      <div style="padding:1rem">
        <div class="skeleton skeleton-text short" style="margin-bottom:0.4rem;height:10px"></div>
        <div class="skeleton skeleton-text medium" style="margin-bottom:0.4rem"></div>
        <div class="skeleton skeleton-text short" style="height:10px;margin-bottom:0.75rem"></div>
        <div class="skeleton skeleton-btn"></div>
      </div>
    </div>
  `).join('');
}
