/* ═══════════════════════════════════════════════════════════
   Auth.js - Login & Register page logic
═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // Redirect if already logged in
  if (isLoggedIn()) {
    const params = new URLSearchParams(window.location.search);
    window.location.href = params.get('redirect') || '/frontend/index.html';
    return;
  }

  const page = document.body.dataset.page;
  if (page === 'login') initLogin();
  if (page === 'register') initRegister();

  // Session expired message
  const params = new URLSearchParams(window.location.search);
  if (params.get('session') === 'expired') {
    showToast('Your session has expired. Please login again.', 'warning');
  }
});

function initLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormErrors();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!email) return showFieldError('email', 'Email is required');
    if (!password) return showFieldError('password', 'Password is required');

    setLoading(submitBtn, true);

    try {
      const data = await Auth.login({ email, password });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Sync wishlist
      if (data.user.role !== 'admin') {
        try {
          const wl = await Users.getWishlist();
          const ids = (wl.wishlist || []).map(p => p._id);
          localStorage.setItem('wishlist', JSON.stringify(ids));
        } catch (_) {}
      }

      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');

      if (data.user.role === 'admin') {
        window.location.href = redirect || '/frontend/admin/dashboard.html';
      } else {
        window.location.href = redirect || '/frontend/index.html';
      }
    } catch (err) {
      showToast(err.message, 'error');
      setLoading(submitBtn, false);
    }
  });
}

function initRegister() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormErrors();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitBtn = form.querySelector('button[type="submit"]');

    let valid = true;
    if (!name) { showFieldError('name', 'Name is required'); valid = false; }
    if (!email) { showFieldError('email', 'Email is required'); valid = false; }
    if (!password || password.length < 6) { showFieldError('password', 'Password must be at least 6 characters'); valid = false; }
    if (password !== confirmPassword) { showFieldError('confirmPassword', 'Passwords do not match'); valid = false; }
    if (!valid) return;

    setLoading(submitBtn, true);

    try {
      const data = await Auth.register({ name, email, password });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      showToast('Account created successfully! Welcome!', 'success');
      setTimeout(() => window.location.href = '/frontend/index.html', 1200);
    } catch (err) {
      showToast(err.message, 'error');
      setLoading(submitBtn, false);
    }
  });
}

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.add('error');
  const err = document.createElement('div');
  err.className = 'form-error';
  err.id = `${fieldId}Error`;
  err.textContent = message;
  field.parentElement.appendChild(err);
}

function clearFormErrors() {
  document.querySelectorAll('.form-control.error').forEach(el => el.classList.remove('error'));
  document.querySelectorAll('.form-error').forEach(el => el.remove());
}

function setLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  const originalText = btn.dataset.originalText || btn.innerHTML;
  if (loading) {
    btn.dataset.originalText = originalText;
    btn.innerHTML = `<span class="spinner spinner-sm" style="border-color:rgba(255,255,255,0.3);border-top-color:#fff;"></span> Loading...`;
  } else {
    btn.innerHTML = originalText;
  }
}

// Toggle password visibility
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', function () {
      const targetId = this.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;
      const isText = input.type === 'text';
      input.type = isText ? 'password' : 'text';
      const icon = this.querySelector('i');
      if (icon) icon.className = isText ? 'fas fa-eye' : 'fas fa-eye-slash';
    });
  });
});
