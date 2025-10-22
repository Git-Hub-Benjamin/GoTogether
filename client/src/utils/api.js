export const API_BASE = process.env.SHARED_API_BASE || "http://localhost:5000/api";

export const ENDPOINTS = {
  RIDES: `${API_BASE}/rides`,
  AUTH: `${API_BASE}/auth`,
  SCHOOLS: `${API_BASE}/schools`,
  DEBUG: `${API_BASE}/debug`,
  SERVER: `${API_BASE.replace('/api', '')}`
};