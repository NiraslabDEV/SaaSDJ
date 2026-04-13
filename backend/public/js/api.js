// API Client - Gerencia autenticação, tokens e requisições HTTP
const API_BASE = '/api';

// ============================================
// Storage & Token Management
// ============================================

function getAccessToken() {
  return localStorage.getItem('accessToken');
}

function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}

function getUser() {
  const userJson = localStorage.getItem('user');
  return userJson ? JSON.parse(userJson) : null;
}

function setTokens(accessToken, refreshToken) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

// ============================================
// Core HTTP Function
// ============================================

async function apiFetch(endpoint, options = {}) {
  const method = options.method || 'GET';
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Adicionar token de acesso
  const accessToken = getAccessToken();
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // Se 401, tentar refresh
  if (response.status === 401) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setTokens(data.accessToken, data.refreshToken);

          // Retry original request com novo token
          headers['Authorization'] = `Bearer ${data.accessToken}`;
          response = await fetch(`${API_BASE}${endpoint}`, {
            method,
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined,
          });
        } else {
          // Refresh falhou, redirecionar para login
          clearTokens();
          window.location.href = '/login.html';
          throw new Error('Sessão expirada');
        }
      } catch (err) {
        clearTokens();
        window.location.href = '/login.html';
        throw err;
      }
    } else {
      window.location.href = '/login.html';
      throw new Error('Sem autorização');
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return await response.json();
}

// ============================================
// Auth Functions
// ============================================

async function login(email, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  
  setTokens(data.accessToken, data.refreshToken);
  setUser(data.user);
  return data;
}

async function register(name, email, password, role) {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: { name, email, password, role },
  });
  
  setTokens(data.accessToken, data.refreshToken);
  setUser(data.user);
  return data;
}

function logout() {
  clearTokens();
}

// ============================================
// User Functions
// ============================================

async function getMe() {
  return apiFetch('/users/me');
}

async function updateMe(data) {
  return apiFetch('/users/me', {
    method: 'PATCH',
    body: data,
  });
}

async function getArtist(id) {
  return apiFetch(`/users/artists/${id}`);
}

// ============================================
// Bookings Functions
// ============================================

async function listBookings() {
  return apiFetch('/bookings');
}

async function getBooking(id) {
  return apiFetch(`/bookings/${id}`);
}

async function createBooking(data) {
  return apiFetch('/bookings', {
    method: 'POST',
    body: data,
  });
}

async function updateBookingStatus(id, status) {
  return apiFetch(`/bookings/${id}/status`, {
    method: 'PATCH',
    body: { status },
  });
}

async function sendCounterProposal(id, data) {
  return apiFetch(`/bookings/${id}/counter-proposal`, {
    method: 'POST',
    body: data,
  });
}

// ============================================
// Earnings Functions
// ============================================

async function getEarnings() {
  return apiFetch('/payments/earnings');
}

// ============================================
// Contracts Functions
// ============================================

async function generateContract(bookingId) {
  return apiFetch(`/contracts/${bookingId}`, {
    method: 'POST',
  });
}

// ============================================
// Notifications Functions
// ============================================

async function getNotifications() {
  return apiFetch('/notifications');
}

// ============================================
// Artists Functions
// ============================================

async function getArtists() {
  return apiFetch('/users/artists');
}

// ============================================
// Utility Functions
// ============================================

function isLoggedIn() {
  return !!getAccessToken();
}

function redirectIfNotLoggedIn() {
  if (!isLoggedIn()) {
    window.location.href = '/login.html';
  }
}

function redirectIfLoggedIn() {
  if (isLoggedIn()) {
    const user = getUser();
    const route = user?.role === 'ARTIST' ? '/dashboard.html' : '/index.html';
    window.location.href = route;
  }
}
