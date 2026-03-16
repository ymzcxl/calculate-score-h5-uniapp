// 环境配置
export const env = {
  // 开发环境
  development: {
    API_BASE_URL: 'http://localhost:3000/api'
  },
  // 生产环境
  production: {
    API_BASE_URL: 'http://38.182.96.171:3000/api'
  }
};

// 获取当前环境
export const getCurrentEnv = () => {
  // 小程序环境判断
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  return 'development';
};

// 导出当前环境的配置
export const currentConfig = env[getCurrentEnv()];
