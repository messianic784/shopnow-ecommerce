/* ═══════════════════════════════════════════════════════════
   API Utility - All backend communication goes through here
═══════════════════════════════════════════════════════════ */

const API_BASE = 'http://localhost:5000/api';
const SERVER_URL = 'http://localhost:5000';

// Resolve any image path to a full URL.
// - Relative paths (/uploads/...) are served by the Express backend, not the
//   frontend dev server, so we must prepend SERVER_URL.
// - Absolute URLs (http/https) are returned unchanged.
// - Empty / null returns '' so callers can fall back to a placeholder with ||.
function getImageUrl(src) {
  if (!src) return '';
  if (src.startsWith('http')) return src;
  if (src.startsWith('/')) return `${SERVER_URL}${src}`;
  return src;
}

function getToken() {
  return localStorage.getItem('token');
}

function getAuthHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {})
    }
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.includes('login') && !window.location.pathname.includes('register')) {
          window.location.href = '/frontend/login.html?session=expired';
        }
      }
      throw new Error(data.message || `Request failed: ${res.status}`);
    }

    return data;
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error('Cannot connect to server. Please make sure the backend is running on port 5000.');
    }
    throw err;
  }
}

async function requestFormData(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getToken();
  const config = {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  };

  const res = await fetch(url, config);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

/* ── Auth ──────────────────────────────────────────────────── */
const Auth = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me')
};

/* ── Products ──────────────────────────────────────────────── */
const Products = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products${qs ? '?' + qs : ''}`);
  },
  getOne: (id) => request(`/products/${id}`),
  getFeatured: () => request('/products/featured'),
  getCategories: () => request('/products/categories'),
  review: (id, body) => request(`/products/${id}/reviews`, { method: 'POST', body: JSON.stringify(body) })
};

/* ── Orders ────────────────────────────────────────────────── */
const Orders = {
  create: (body) => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
  myOrders: () => request('/orders/myorders'),
  getOne: (id) => request(`/orders/${id}`),
  pay: (id, body) => request(`/orders/${id}/pay`, { method: 'PUT', body: JSON.stringify(body) })
};

/* ── Users ─────────────────────────────────────────────────── */
const Users = {
  getProfile: () => request('/users/profile'),
  updateProfile: (body) => request('/users/profile', { method: 'PUT', body: JSON.stringify(body) }),
  changePassword: (body) => request('/users/password', { method: 'PUT', body: JSON.stringify(body) }),
  getWishlist: () => request('/users/wishlist'),
  toggleWishlist: (productId) => request(`/users/wishlist/${productId}`, { method: 'POST' })
};

/* ── Payment ───────────────────────────────────────────────── */
const Payment = {
  // Returns publishable keys — safe to expose, keys never leave the server
  getConfig: () => request('/payment/config'),
  // Creates a Stripe PaymentIntent server-side; returns client_secret
  createIntent: (body) => request('/payment/create-intent', { method: 'POST', body: JSON.stringify(body) })
};

/* ── Admin ─────────────────────────────────────────────────── */
const Admin = {
  stats: () => request('/admin/stats'),

  // Products
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/products${qs ? '?' + qs : ''}`);
  },
  createProduct: (formData) => requestFormData('/admin/products', { method: 'POST', body: formData }),
  updateProduct: (id, formData) => requestFormData(`/admin/products/${id}`, { method: 'PUT', body: formData }),
  deleteProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE' }),

  // Users
  getUsers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/users${qs ? '?' + qs : ''}`);
  },
  updateUser: (id, body) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/orders${qs ? '?' + qs : ''}`);
  },
  updateOrder: (id, body) => request(`/admin/orders/${id}`, { method: 'PUT', body: JSON.stringify(body) })
};
