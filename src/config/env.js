const trimTrailingSlash = (value = '') => String(value).replace(/\/+$/, '');

const getBrowserOrigin = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return trimTrailingSlash(window.location.origin);
  }

  return 'http://localhost:3000';
};

const getEnvValue = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) {
    return trimTrailingSlash(import.meta.env[key]);
  }

  return '';
};

const resolveApiBaseUrl = (fallbackOrigin) => {
  const apiBaseUrl = getEnvValue('VITE_API_BASE_URL');
  if (apiBaseUrl) {
    return apiBaseUrl;
  }

  return `${trimTrailingSlash(fallbackOrigin)}/api`;
};

const resolveSocketUrl = (fallbackOrigin) => {
  const socketUrl = getEnvValue('VITE_SOCKET_URL');
  if (socketUrl) {
    return socketUrl;
  }

  return trimTrailingSlash(fallbackOrigin);
};

const browserOrigin = getBrowserOrigin();

const env = {
  development: {
    API_BASE_URL: resolveApiBaseUrl('http://localhost:3000'),
    SOCKET_URL: resolveSocketUrl('http://localhost:3000')
  },
  production: {
    API_BASE_URL: resolveApiBaseUrl(browserOrigin),
    SOCKET_URL: resolveSocketUrl(browserOrigin)
  }
};

export const getCurrentEnv = () => (
  process.env.NODE_ENV === 'production' ? 'production' : 'development'
);

export const currentConfig = env[getCurrentEnv()];
