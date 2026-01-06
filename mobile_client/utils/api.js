// when using hotspot
// const laptop_ip = '172.20.10.2'; //'10.9.51.119';
//const PORT = 5000;

const ngrok_url = 'https://mindi-loral-unorthodoxly.ngrok-free.dev'
// hotspot
//export const API_BASE = process.env.SHARED_API_BASE || `https://mindi-loral-unorthodoxly.ngrok-free.dev/api`;
// ngrok
export const API_BASE = process.env.SHARED_API_BASE || `${ngrok_url}/api`;

export const ENDPOINTS = {
  RIDES: `${API_BASE}/rides`,
  AUTH: `${API_BASE}/auth`,
  SCHOOLS: `${API_BASE}/schools`,
  DEBUG: `${API_BASE}/debug`,
  SERVER: `${API_BASE.replace('/api', '')}`
};

console.log('🔧 API Configuration:');
console.log('  API_BASE:', API_BASE);
console.log('  SERVER:', ENDPOINTS.SERVER);
console.log('  RIDES:', ENDPOINTS.RIDES);