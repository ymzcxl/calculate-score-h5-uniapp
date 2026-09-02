const getBrowserOrigin = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return 'http://38.182.96.171:3000';
};

const env = {
  development: {
    API_BASE_URL: 'http://localhost:3000/api',
    SOCKET_URL: 'http://localhost:3000'
  },
  production: {
    API_BASE_URL: `${getBrowserOrigin()}/api`,
    SOCKET_URL: getBrowserOrigin()
  }
};

export const getCurrentEnv = () => (
  process.env.NODE_ENV === 'production' ? 'production' : 'development'
);

export const currentConfig = env[getCurrentEnv()];
