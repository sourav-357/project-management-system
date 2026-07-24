/**
 * Resolves the Socket.io server URL dynamically based on environment variables or location.
 * Priorities:
 * 1. Explicit VITE_SOCKET_URL (useful if sockets are hosted on a separate service like Render/Railway)
 * 2. Origin derived from VITE_API_BASE_URL / VITE_API_URL
 * 3. Localhost fallback in dev, or current window origin
 *
 * Returns null if the target host is Vercel Serverless (.vercel.app),
 * preventing continuous 404 polling attempts.
 */
let loggedVercelNotice = false;

export const getSocketUrl = () => {
  let targetUrl = null;

  if (import.meta.env.VITE_SOCKET_URL) {
    let socketEnv = import.meta.env.VITE_SOCKET_URL.trim();
    if (socketEnv) {
      if (!/^https?:\/\//i.test(socketEnv)) {
        socketEnv = `https://${socketEnv}`;
      }
      targetUrl = socketEnv.replace(/\/+$/, '');
    }
  }

  if (!targetUrl) {
    const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
    if (apiBase) {
      let raw = apiBase.trim();
      if (!/^https?:\/\//i.test(raw) && !raw.startsWith('/')) {
        raw = `https://${raw}`;
      }
      try {
        const url = new URL(raw);
        targetUrl = url.origin;
      } catch (err) {
        console.warn('Invalid VITE_API_BASE_URL format for socket origin extraction:', apiBase);
      }
    }
  }

  if (!targetUrl && typeof window !== 'undefined' && window.location) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      targetUrl = `${window.location.protocol}//${window.location.hostname}:3000`;
    } else {
      targetUrl = window.location.origin;
    }
  }

  if (!targetUrl) {
    targetUrl = 'http://localhost:3000';
  }

  // Check if target URL points to Vercel Serverless (.vercel.app)
  try {
    const parsed = new URL(targetUrl);
    if (parsed.hostname.endsWith('.vercel.app')) {
      if (!loggedVercelNotice) {
        console.info(
          '[Socket.io] Target host is Vercel Serverless (' +
            parsed.hostname +
            '). Socket connections disabled. To enable WebSockets, set VITE_SOCKET_URL to a non-Vercel WebSocket server (e.g., Render/Railway).'
        );
        loggedVercelNotice = true;
      }
      return null;
    }
  } catch (e) {
    // Ignore invalid URL format
  }

  return targetUrl;
};
