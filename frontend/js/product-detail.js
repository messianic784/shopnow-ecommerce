/* ═══════════════════════════════════════════════════════════
   Product-Detail.js - Single product page logic
═══════════════════════════════════════════════════════════ */

let currentProduct = null;
let selectedQty = 1;

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (!productId) {
    window.location.href = '/frontend/products.html';
    return;
  }

  await loadProduct(productId);
});

async function loadProduct(id) {
  const container = document.getElementById('productDetail');
  if (!container) return;

  try {
    const data = await Products.getOne(id);
    currentProduct = data.product;
    renderProduct(currentProduct);
    await loadRelated(currentProduct.category, id);
  } catch (err) {
    container.innerHTML = `
      <div style="text-align:center;padding:5rem 2rem">
        <i class="fas fa-exclamation-circle" style="font-size:4rem;color:var(--danger);margin-bottom:1rem;display:block"></i>
        <h2>Product Not Found</h2>
        <p style="color:var(--text-muted);margin:0.75rem 0 1.5rem">${err.message}</p>
        <a href="/frontend/products.html" class="btn btn-primary">Browse Products</a>
      </div>`;
  }
}

function renderProduct(p) {
  const discount = getDiscount(p.price, p.originalPrice);
  const inStock = p.stock > 0;
  const inWish = getLocalWishlist().includes(p._id);

  // Breadcrumb
  const bc = document.getElementById('breadcrumb');
  if (bc) {
    bc.innerHTML = `
      <a href="/frontend/index.html">Home</a><span class="sep">/</span>
      <a href="/frontend/products.html">Products</a><span class="sep">/</span>
      <a href="/frontend/products.html?category=${p.category}">${p.category}</a><span class="sep">/</span>
      <span class="current">${p.name}</span>`;
  }

  // Gallery
  const images = p.images?.length
    ? p.images.map(img => getImageUrl(img))
    : ['https://placehold.co/500x500?text=No+Image'];

  document.getElementById('mainImage').src = images[0];
  document.getElementById('mainImage').alt = p.name;

  const thumbsEl = document.getElementById('galleryThumbs');
  if (thumbsEl) {
    thumbsEl.innerHTML = images.map((img, i) => `
      <div class="gallery-thumb ${i === 0 ? 'active' : ''}" onclick="switchImage(this, '${img}')">
        <img src="${img}" alt="${p.name}" onerror="this.src='https://placehold.co/70x70?text=No+Image'">
      </div>`).join('');
  }

  // Details
  const setInner = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
  const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };

  setText('productCategory', p.category);
  setText('productName', p.name);
  setInner('productRating', `${renderStars(p.ratings || 0)} <span style="font-size:0.9rem;color:var(--text-muted)">${(p.ratings || 0).toFixed(1)} (${p.numReviews || 0} reviews)</span>`);

  setText('productBrand', p.brand ? `Brand: ${p.brand}` : '');

  const priceEl = document.getElementById('productPrice');
  if (priceEl) {
    priceEl.innerHTML = `
      <span class="detail-price-current">${formatPrice(p.price)}</span>
      ${p.originalPrice > p.price ? `<span class="detail-price-original">${formatPrice(p.originalPrice)}</span>` : ''}
      ${discount > 0 ? `<span class="detail-price-save">Save ${discount}%</span>` : ''}`;
  }

  const stockEl = document.getElementById('stockStatus');
  if (stockEl) {
    stockEl.className = 'stock-indicator';
    if (!inStock) { stockEl.classList.add('stock-out'); stockEl.innerHTML = '<i class="fas fa-times-circle"></i> Out of Stock'; }
    else if (p.stock <= 5) { stockEl.classList.add('stock-low'); stockEl.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Only ${p.stock} left!`; }
    else { stockEl.classList.add('stock-in'); stockEl.innerHTML = `<i class="fas fa-check-circle"></i> In Stock (${p.stock} available)`; }
  }

  setText('productDescription', p.description);

  // Tags
  const tagsEl = document.getElementById('productTags');
  if (tagsEl && p.tags?.length) {
    tagsEl.innerHTML = p.tags.map(t => `<span class="tag">#${t}</span>`).join('');
  }

  // Qty control
  updateQtyDisplay();

  // Wishlist button
  const wBtn = document.getElementById('wishlistBtn');
  if (wBtn) {
    wBtn.className = `btn ${inWish ? 'btn-danger' : 'btn-outline'} btn-lg`;
    wBtn.innerHTML = `<i class="${inWish ? 'fas' : 'far'} fa-heart"></i> ${inWish ? 'Wishlisted' : 'Wishlist'}`;
    wBtn.disabled = !inStock;
    wBtn.onclick = () => toggleWishlistItem(p._id, wBtn);
  }

  // Add to cart
  const atcBtn = document.getElementById('addToCartBtn');
  if (atcBtn) {
    atcBtn.disabled = !inStock;
    atcBtn.innerHTML = `<i class="fas fa-shopping-cart"></i> ${inStock ? 'Add to Cart' : 'Out of Stock'}`;
  }

  // Reviews
  renderReviews(p.reviews || []);
  initReviewForm(p._id);

  // Page title
  document.title = `${p.name} - ShopNow`;
}

function switchImage(thumb, src) {
  document.getElementById('mainImage').src = src;
  document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
}

function changeQty(delta) {
  if (!currentProduct) return;
  selectedQty = Math.min(Math.max(1, selectedQty + delta), currentProduct.stock || 99);
  updateQtyDisplay();
}

function updateQtyDisplay() {
  const el = document.getElementById('qtyValue');
  if (el) el.textContent = selectedQty;
  const minusBtn = document.getElementById('qtyMinus');
  const plusBtn = document.getElementById('qtyPlus');
  if (minusBtn) minusBtn.disabled = selectedQty <= 1;
  if (plusBtn) plusBtn.disabled = currentProduct && selectedQty >= currentProduct.stock;
}

function addProductToCart() {
  if (!currentProduct) return;
  addToCart(currentProduct, selectedQty);
  const btn = document.getElementById('addToCartBtn');
  if (btn) {
    btn.innerHTML = '<i class="fas fa-check"></i> Added!';
    btn.style.background = 'var(--success)';
    setTimeout(() => {
      btn.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
      btn.style.background = '';
    }, 1500);
  }
}

function renderReviews(reviews) {
  const container = document.getElementById('reviewsList');
  if (!container) return;

  if (reviews.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem">No reviews yet. Be the first to review!</p>';
    return;
  }

  // Summary
  const avgEl = document.getElementById('avgRating');
  const avgStarsEl = document.getElementById('avgStars');
  const avgCountEl = document.getElementById('avgCount');
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  if (avgEl) avgEl.textContent = avg.toFixed(1);
  if (avgStarsEl) avgStarsEl.innerHTML = renderStars(avg);
  if (avgCountEl) avgCountEl.textContent = `${reviews.length} review${reviews.length !== 1 ? 's' : ''}`;

  // Rating bars
  const barsEl = document.getElementById('ratingBars');
  if (barsEl) {
    barsEl.innerHTML = [5, 4, 3, 2, 1].map(star => {
      const count = reviews.filter(r => Math.floor(r.rating) === star).length;
      const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
      return `<div class="rating-bar-row">
        <span>${star}</span><i class="fas fa-star" style="color:var(--secondary);font-size:0.7rem"></i>
        <div class="rating-bar-track"><div class="rating-bar-fill" style="width:${pct}%"></div></div>
        <span style="width:1.5rem">${count}</span>
      </div>`;
    }).join('');
  }

  container.innerHTML = reviews.slice().reverse().map(r => `
    <div class="review-item fade-in">
      <div class="review-header">
        <div class="review-avatar">${r.name.charAt(0).toUpperCase()}</div>
        <div>
          <div class="review-name">${r.name}</div>
          <div class="review-date">${formatDate(r.createdAt)}</div>
        </div>
        <div class="review-stars" style="margin-left:auto">${renderStars(r.rating)}</div>
      </div>
      <div class="review-comment">${r.comment}</div>
    </div>`).join('');
}

function initReviewForm(productId) {
  const form = document.getElementById('reviewForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!requireAuth()) return;

    const rating = form.querySelector('input[name="rating"]:checked')?.value;
    const comment = document.getElementById('reviewComment').value.trim();

    if (!rating) return showToast('Please select a rating', 'warning');
    if (!comment) return showToast('Please enter a comment', 'warning');

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner spinner-sm"></span> Submitting...';

    try {
      await Products.review(productId, { rating: Number(rating), comment });
      showToast('Review submitted successfully!', 'success');
      form.reset();
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Review';
      // Reload reviews
      const data = await Products.getOne(productId);
      renderReviews(data.product.reviews || []);
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Review';
    }
  });
}

async function loadRelated(category, excludeId) {
  const container = document.getElementById('relatedProducts');
  if (!container) return;
  try {
    const data = await Products.getAll({ category, limit: 4 });
    const related = (data.products || []).filter(p => p._id !== excludeId).slice(0, 4);
    if (related.length === 0) { container.closest('.section')?.remove(); return; }
    container.innerHTML = related.map(p => renderProductCard(p)).join('');
  } catch (_) {}
}

function renderProductCard(product) {
  const discount = getDiscount(product.price, product.originalPrice);
  const inStock = product.stock > 0;
  return `
    <div class="product-card fade-in">
      <div class="product-img-wrap">
        <a href="/frontend/product-detail.html?id=${product._id}">
          <img src="${getImageUrl(product.images?.[0]) || 'https://placehold.co/300x300?text=No+Image'}" alt="${product.name}" loading="lazy">
        </a>
        ${discount > 0 ? '<div class="product-badges"><span class="badge-sale">-' + discount + '%</span></div>' : ''}
      </div>
      <div class="product-info">
        <div class="product-category">${product.category}</div>
        <h3 class="product-name"><a href="/frontend/product-detail.html?id=${product._id}">${product.name}</a></h3>
        <div class="product-rating">
          <div class="stars">${renderStars(product.ratings || 0)}</div>
          <span class="rating-count">(${product.numReviews || 0})</span>
        </div>
        <div class="product-price">
          <span class="price-current">${formatPrice(product.price)}</span>
          ${product.originalPrice > product.price ? `<span class="price-original">${formatPrice(product.originalPrice)}</span>` : ''}
        </div>
        <button class="add-to-cart-btn" onclick="addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')})" ${!inStock ? 'disabled' : ''}>
          <i class="fas fa-cart-plus"></i> ${inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>`;
}
