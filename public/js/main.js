document.addEventListener('DOMContentLoaded', () => {
  checkAuthState();
  initStatCounters();
  initFormValidation();
});

/* ===== AUTH STATE ===== */
async function checkAuthState() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    updateNav(data.success ? data.user : null);
  } catch {
    updateNav(null);
  }
}

function updateNav(user) {
  const navRight = document.getElementById('navRight');
  if (!navRight) return;

  if (user) {
    navRight.innerHTML = `
      <span class="user-greeting">Hi, ${user.fullName.split(' ')[0]}</span>
      <button class="btn btn-danger btn-sm" id="logoutBtn">Logout</button>
    `;
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  } else {
    const currentPath = window.location.pathname;
    if (currentPath === '/login' || currentPath === '/register') {
      navRight.innerHTML = `
        <a href="/login" class="btn btn-outline btn-sm">Login</a>
        <a href="/register" class="btn btn-primary btn-sm">Register</a>
      `;
    }
  }
}

async function handleLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  } catch (err) {
    console.error('Logout failed:', err);
  }
}

/* ===== STAT COUNTERS ===== */
function initStatCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => observer.observe(counter));
}

function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const duration = 1500;
  const step = target / (duration / 16);
  let current = 0;

  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      el.textContent = target + '+';
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(current);
    }
  }, 16);
}

/* ===== FORM VALIDATION & SUBMISSION ===== */
function initFormValidation() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
    addLiveValidation(loginForm);
  }

  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
    addLiveValidation(registerForm);

    const confirmPw = document.getElementById('confirmPassword');
    if (confirmPw) {
      confirmPw.addEventListener('input', () => {
        const pw = document.getElementById('password').value;
        if (confirmPw.value !== pw) {
          confirmPw.classList.add('error');
        } else {
          confirmPw.classList.remove('error');
        }
      });
    }
  }
}

function addLiveValidation(form) {
  form.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('blur', () => {
      if (input.required && !input.value.trim()) {
        input.classList.add('error');
      } else {
        input.classList.remove('error');
      }
    });
    input.addEventListener('input', () => {
      if (input.classList.contains('error') && input.value.trim()) {
        input.classList.remove('error');
      }
    });
  });
}

function showAlert(id, message) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 5000);
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading ? '<span class="loader"></span> Please wait...' : btn.dataset.originalText || btn.textContent;
  if (!btn.dataset.originalText) btn.dataset.originalText = btn.textContent;
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    showAlert('loginError', 'Please fill in all fields');
    return;
  }

  setLoading('loginBtn', true);

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (data.success) {
      showAlert('loginSuccess', 'Login successful! Redirecting...');
      setTimeout(() => { window.location.href = '/'; }, 1000);
    } else {
      showAlert('loginError', data.message);
    }
  } catch (err) {
    showAlert('loginError', 'Network error. Please try again.');
  } finally {
    setLoading('loginBtn', false);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const fullName = document.getElementById('fullName').value.trim();
  const email = document.getElementById('email').value.trim();
  const department = document.getElementById('department').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (!fullName || !email || !department || !password || !confirmPassword) {
    showAlert('regError', 'Please fill in all fields');
    return;
  }

  if (password !== confirmPassword) {
    showAlert('regError', 'Passwords do not match');
    return;
  }

  if (password.length < 6) {
    showAlert('regError', 'Password must be at least 6 characters');
    return;
  }

  setLoading('regBtn', true);

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, department, password, confirmPassword })
    });

    const data = await res.json();

    if (data.success) {
      showAlert('regSuccess', 'Account created! Redirecting...');
      setTimeout(() => { window.location.href = '/'; }, 1500);
    } else {
      showAlert('regError', data.message);
    }
  } catch (err) {
    showAlert('regError', 'Network error. Please try again.');
  } finally {
    setLoading('regBtn', false);
  }
}
