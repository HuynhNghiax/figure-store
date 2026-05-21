export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('fighub_user'));
  } catch {
    return null;
  }
};

export const getToken = () => localStorage.getItem('fighub_token');

export const saveAuth = (data) => {
  if (data.token) localStorage.setItem('fighub_token', data.token);
  localStorage.setItem('fighub_user', JSON.stringify({
    id: data.id,
    username: data.username,
    role: data.role,
    email: data.email,
  }));
};

export const clearAuth = () => {
  localStorage.removeItem('fighub_token');
  localStorage.removeItem('fighub_user');
};

export const getAuthHeaders = (extra = {}) => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
};

export const getAdminHeaders = getAuthHeaders;

export const authFetch = async (path, options = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...options.headers },
  });
  if (res.status === 401) {
    clearAuth();
    window.location.href = '/login';
  }
  return res;
};

export const imageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};
