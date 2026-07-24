import axios from 'axios';

let inMemoryToken = null;

export const setAccessToken = (token) => {
  inMemoryToken = token;
};

export const getAccessToken = () => inMemoryToken;

/**
 * Normalizes backend API base URL automatically:
 * - Prepends https:// if protocol is missing (e.g. "my-backend.vercel.app" -> "https://my-backend.vercel.app")
 * - Appends /api/v1 suffix if missing
 * - Strips trailing slashes
 */
const getNormalizedApiBaseUrl = () => {
  let envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

  if (!envUrl) {
    return '/api/v1';
  }

  envUrl = envUrl.trim();

  // Relative path (local proxy)
  if (envUrl.startsWith('/')) {
    return envUrl.replace(/\/+$/, '');
  }

  // Prepend protocol if missing
  if (!/^https?:\/\//i.test(envUrl)) {
    if (envUrl.startsWith('localhost') || envUrl.startsWith('127.0.0.1')) {
      envUrl = `http://${envUrl}`;
    } else {
      envUrl = `https://${envUrl}`;
    }
  }

  // Strip trailing slashes
  envUrl = envUrl.replace(/\/+$/, '');

  // Append /api/v1 if missing
  if (!envUrl.endsWith('/api/v1')) {
    if (envUrl.endsWith('/api')) {
      envUrl = `${envUrl}/v1`;
    } else {
      envUrl = `${envUrl}/api/v1`;
    }
  }

  return envUrl;
};

const api = axios.create({
  baseURL: getNormalizedApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (inMemoryToken) {
      config.headers.Authorization = `Bearer ${inMemoryToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh-token')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await api.post(
          '/auth/refresh-token',
          {}
        );

        const newAccessToken = res.data.data.accessToken;
        setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setAccessToken(null);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
