// API Base URL for AEROSCOPE Backend
// Automatically reads VITE_API_URL set in Vercel environment variables, falling back to Render backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://aeroscope-backend.onrender.com';

export default API_BASE_URL;
