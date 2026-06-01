/* ═══════════════════════════════════════════════════════════
   Wishlist.js - Wishlist page logic
═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  await loadWishlist();
});

async function loadWishlist() {
  const container = document.getElementById('wishlistGrid');
  const emptyMsg = document.getElementById('wishlistEmpty');
  if (!container) return;

  container.innerHTML = renderSkeletons(4);

  try {
    const data = await Users.getWishlist();
    const items = data.wishlist || [];

    // Sync local cache
    localStorage.setItem('wishlist', JSON.stringify(items.map(p => p._id)));
    updateWishlistBadge();

    if (items.length === 0) {
      container.innerHTML = '';
      if (emptyMsg) emptyMsg.style.display = 'block';
      return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';

    container.innerHTML = items.map(product => {
      const discount = getDiscount(product.price, product.originalPrice);
      const inStock = product.stock > 0;
      return `
        <div class="product-card fade-in" id="wishcard-${product._id}">
          <div class="product-img-wrap">
            <a href="/frontend/product-detail.html?id=${product._id}">
              <img src="${getImageUrl(product.images?.[0]) || 'https://placehold.co/300x300?text=No+Image'}" alt="${product.name}" loading="lazy" onerror="this.src='https://placehold.co/300x300?text=No+Image'">
            </a>
            ${!inStock ? '<div class="product-badges"><span class="badge-out">Out of Stock</span></div>' : ''}
          </div>
          <div class="product-info">
            <div class="product-category">${product.category || ''}</div>
            <h3 class="product-name">
              <a href="/frontend/product-detail.html?id=${product._id}">${product.name}</a>
            </h3>
            <div class="product-rating">
              <div class="stars">${renderStars(product.ratings || 0)}</div>
              <span class="rating-count">(${product.ratings ? product.ratings.toFixed(1) : '0.0'})</span>
            </div>
            <div class="product-price">
              <span class="price-current">${formatPrice(product.price)}</span>
              ${discount > 0 ? `<span class="price-discount">-${discount}%</span>` : ''}
            </div>
            <div style="display:flex;gap:0.5rem;margin-top:0.5rem;">
              <button class="add-to-cart-btn" onclick="moveToCart('${product._id}', '${product.name.replace(/'/g, "\\'")}', ${product.price}, '${getImageUrl(product.images?.[0])}', ${product.stock})" ${!inStock ? 'disabled' : ''} style="flex:1;">
                <i class="fas fa-cart-plus"></i> ${inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
              <button class="btn btn-ghost btn-sm btn-icon" onclick="removeFromWishlist('${product._id}')" title="Remove from wishlist" style="border:1px solid var(--border);">
                <i class="fas fa-trash-alt" style="color:var(--danger);"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = `<div class="alert alert-error"><i class="fas fa-exclamation-circle"></i> ${err.message}</div>`;
  }
}

function moveToCart(id, name, price, image, stock) {
  addToCart({ _id: id, name, price, images: [image], stock });
}

async function removeFromWishlist(productId) {
  try {
    await Users.toggleWishlist(productId);
    const wishlist = getLocalWishlist().filter(id => id !== productId);
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    updateWishlistBadge();

    const card = document.getElementById(`wishcard-${productId}`);
    if (card) {
      card.style.opacity = '0';
      card.style.transform = 'scale(0.9)';
      card.style.transition = 'all 0.3s ease';
      setTimeout(() => { card.remove(); checkEmpty(); }, 300);
    }
    showToast('Removed from wishlist', 'info');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function checkEmpty() {
  const container = document.getElementById('wishlistGrid');
  const emptyMsg = document.getElementById('wishlistEmpty');
  if (container && container.children.length === 0) {
    if (emptyMsg) emptyMsg.style.display = 'block';
  }
}

function renderSkeletons(count) {
  return Array(count).fill('').map(() => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-img"></div>
      <div style="padding:1rem">
        <div class="skeleton skeleton-text medium" style="margin-bottom:0.5rem"></div>
        <div class="skeleton skeleton-text short"></div>
        <div class="skeleton skeleton-btn" style="margin-top:0.75rem"></div>
      </div>
    </div>
  `).join('');
}
