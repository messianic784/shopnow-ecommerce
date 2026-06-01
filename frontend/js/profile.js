/* ═══════════════════════════════════════════════════════════
   Profile.js - User profile page logic
═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  await loadProfile();
  initProfileForms();
  initTabs();
});

async function loadProfile() {
  try {
    const data = await Users.getProfile();
    const user = data.user;

    // Sidebar info
    setContent('profileName', user.name);
    setContent('profileEmail', user.email);

    const initial = user.name.charAt(0).toUpperCase();
    document.querySelectorAll('.profile-avatar-letter').forEach(el => el.textContent = initial);

    // Count orders from wishlist length as a proxy stat
    setContent('wishlistCount', user.wishlist?.length || 0);

    // Profile form
    setValue('profileFormName', user.name);
    setValue('profileFormEmail', user.email);
    setValue('profileFormPhone', user.phone || '');
    setValue('profileStreet', user.address?.street || '');
    setValue('profileCity', user.address?.city || '');
    setValue('profileState', user.address?.state || '');
    setValue('profileCountry', user.address?.country || '');
    setValue('profileZipCode', user.address?.zipCode || '');

  } catch (err) {
    showToast(err.message, 'error');
  }
}

function initProfileForms() {
  // Profile update form
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = profileForm.querySelector('button[type="submit"]');
      setButtonLoading(btn, true);

      try {
        const body = {
          name: getValue('profileFormName'),
          email: getValue('profileFormEmail'),
          phone: getValue('profileFormPhone'),
          address: {
            street: getValue('profileStreet'),
            city: getValue('profileCity'),
            state: getValue('profileState'),
            country: getValue('profileCountry'),
            zipCode: getValue('profileZipCode')
          }
        };

        const data = await Users.updateProfile(body);

        // Update local user data
        const currentUser = getCurrentUser();
        const updated = { ...currentUser, name: data.user.name, email: data.user.email };
        localStorage.setItem('user', JSON.stringify(updated));

        showToast('Profile updated successfully!', 'success');
        setContent('profileName', data.user.name);
        document.querySelectorAll('.profile-avatar-letter').forEach(el => el.textContent = data.user.name.charAt(0).toUpperCase());
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setButtonLoading(btn, false);
      }
    });
  }

  // Password change form
  const passwordForm = document.getElementById('passwordForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = passwordForm.querySelector('button[type="submit"]');
      const newPw = getValue('newPassword');
      const confirmPw = getValue('confirmNewPassword');

      if (newPw !== confirmPw) {
        showToast('New passwords do not match', 'warning');
        return;
      }
      if (newPw.length < 6) {
        showToast('Password must be at least 6 characters', 'warning');
        return;
      }

      setButtonLoading(btn, true);
      try {
        await Users.changePassword({
          currentPassword: getValue('currentPassword'),
          newPassword: newPw
        });
        showToast('Password changed successfully!', 'success');
        passwordForm.reset();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setButtonLoading(btn, false);
      }
    });
  }
}

function initTabs() {
  const tabs = document.querySelectorAll('[data-tab]');
  const panels = document.querySelectorAll('[data-panel]');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.style.display = 'none');

      tab.classList.add('active');
      const panel = document.querySelector(`[data-panel="${target}"]`);
      if (panel) panel.style.display = 'block';
    });
  });

  // Show first tab
  if (tabs.length > 0) tabs[0].click();
}

function setContent(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function setValue(id, val) { const el = document.getElementById(id); if (el) el.value = val; }
function getValue(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
function setButtonLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn.dataset.orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner spinner-sm" style="border-color:rgba(255,255,255,0.3);border-top-color:#fff"></span> Saving...';
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.orig || 'Save';
  }
}
