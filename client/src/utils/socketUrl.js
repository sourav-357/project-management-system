/**
 * Resolves the Socket.io server URL dynamically based on environment variables or location.
 * Priorities:
 * 1. Explicit VITE_SOCKET_URL (useful if sockets are hosted on a separate service like Render/Railway)
 * 2. Origin derived from VITE_API_BASE_URL / VITE_API_URL
 * 3. Localhost fallback in dev, or current window origin
 */
export const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (apiBase) {
    try {
      const url = new URL(apiBase);
      return url.origin;
    } catch (err) {
      console.warn('Invalid VITE_API_BASE_URL format for socket origin extraction:', apiBase);
    }
  }

  if (typeof window !== 'undefined' && window.location) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `${window.location.protocol}//${window.location.hostname}:3000`;
    }
    return window.location.origin;
  }

  return 'http://localhost:3000';
};
