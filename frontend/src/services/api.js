import axios from 'axios';
import { clearAuthSession, getStoredToken } from '../utils/session';

const getDefaultApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:5000/api';
  }

  const { protocol, hostname, port } = window.location;

  // In local Kubernetes setups, frontend is commonly exposed on 30080 and
  // the gateway on 30050, while Vite dev often runs on 5173.
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    if (port === '30080' || port === '5173' || port === '4173') {
      return `${protocol}//${hostname}:30050/api`;
    }
  }

  if (port === '30080') {
    return `${protocol}//${hostname}:30050/api`;
  }

  return 'http://localhost:5000/api';
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || getDefaultApiBaseUrl();

export const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;

    if (!isFormData && config.data && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthSession();
    }
    return Promise.reject(error);
  }
);

export default api;
