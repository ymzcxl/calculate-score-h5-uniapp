import { currentConfig } from '../config/env';

const normalizeRequestError = (error) => {
  const rawMessage = String(error?.errMsg || error?.message || '').trim();
  const apiOrigin = String(currentConfig.API_BASE_URL || '').replace(/\/api\/?$/, '');

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return new Error('当前网络未连接，请先检查网络');
  }

  if (/timeout|Failed to fetch|ERR_CONNECTION_REFUSED|request:fail|unable to connect|无法连接到远程服务器|socket hang up/i.test(rawMessage)) {
    return new Error(`后端服务暂时连不上，请检查 ${apiOrigin || '接口服务'} 是否已启动`);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(rawMessage || '请求失败');
};

const request = ({ url, method = 'GET', data, auth = false }) => new Promise((resolve, reject) => {
  const token = uni.getStorageSync('token');
  const headers = {};

  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  uni.request({
    url: `${currentConfig.API_BASE_URL}${url}`,
    method,
    data,
    header: headers,
    success: (res) => {
      const payload = res.data || {};
      if (payload.code === 200) {
        resolve(payload.data);
        return;
      }

      if (payload.code === 401) {
        uni.removeStorageSync('token');
        uni.removeStorageSync('userInfo');
      }

      reject(new Error(payload.message || '请求失败'));
    },
    fail: (error) => {
      reject(normalizeRequestError(error));
    }
  });
});

export const api = {
  request,
  loginByPhone: (data) => request({ url: '/auth/phone', method: 'POST', data }),
  register: (data) => request({ url: '/auth/register', method: 'POST', data }),
  resetPassword: (data) => request({ url: '/auth/reset-password', method: 'POST', data }),
  changePassword: (data) => request({ url: '/auth/change-password', method: 'POST', data, auth: true }),
  logout: () => request({ url: '/auth/logout', method: 'POST', auth: true }),
  bindPhone: (data) => request({ url: '/auth/bind-phone', method: 'POST', data, auth: true }),
  getUserInfo: () => request({ url: '/user/info', auth: true }),
  updateUserInfo: (data) => request({ url: '/user/update', method: 'POST', data, auth: true }),
  createRoom: (data) => request({ url: '/room/create', method: 'POST', data, auth: true }),
  joinRoom: (data) => request({ url: '/room/join', method: 'POST', data, auth: true }),
  getRoomInfo: (roomId) => request({ url: `/room/info?roomId=${encodeURIComponent(roomId)}`, auth: true }),
  updatePlayerName: (data) => request({ url: '/room/player-name', method: 'POST', data, auth: true }),
  settleRoom: (data) => request({ url: '/room/settle', method: 'POST', data, auth: true }),
  closeRoom: (data) => request({ url: '/room/close', method: 'POST', data, auth: true }),
  exitRoom: (data) => request({ url: '/room/exit', method: 'POST', data, auth: true }),
  updateScore: (data) => request({ url: '/score/update', method: 'POST', data, auth: true }),
  revokeScore: (data) => request({ url: '/score/revoke', method: 'POST', data, auth: true }),
  getScoreHistory: (roomId) => request({ url: `/score/history?roomId=${encodeURIComponent(roomId)}`, auth: true }),
  sendMessage: (data) => request({ url: '/message/send', method: 'POST', data, auth: true }),
  sendLeaderboardNotice: (data) => request({ url: '/message/leaderboard-notice', method: 'POST', data, auth: true }),
  getMessageHistory: (roomId) => request({ url: `/message/history?roomId=${encodeURIComponent(roomId)}`, auth: true }),
  getHistoryList: () => request({ url: '/history/list', auth: true }),
  getHistoryDetail: (roomId) => request({ url: `/history/detail?roomId=${encodeURIComponent(roomId)}`, auth: true }),
  clearHistory: () => request({ url: '/history/clear', method: 'POST', auth: true }),
  getStats: () => request({ url: '/history/stats', auth: true }),
  takeoverSeat: (data) => request({ url: '/room/takeover', method: 'POST', data, auth: true })
};
