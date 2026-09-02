const PENDING_REDIRECT_KEY = 'pending_redirect_url';

export const savePendingRedirect = (url) => {
  if (!url) {
    return;
  }
  uni.setStorageSync(PENDING_REDIRECT_KEY, url);
};

export const consumePendingRedirect = () => {
  const value = uni.getStorageSync(PENDING_REDIRECT_KEY);
  uni.removeStorageSync(PENDING_REDIRECT_KEY);
  return value;
};

export const redirectToLogin = (url) => {
  savePendingRedirect(url);
  uni.reLaunch({ url: '/pages/login/login' });
};

export const getRoomPageUrl = (roomId, isCreator = false) => {
  const creatorQuery = isCreator ? '&isCreator=1' : '';
  return `/pages/room/room?roomId=${encodeURIComponent(roomId)}${creatorQuery}`;
};

export const getRoomShareLink = (roomId) => {
  if (typeof window !== 'undefined' && window.location) {
    const { origin, pathname } = window.location;
    return `${origin}${pathname}#/pages/room/room?roomId=${encodeURIComponent(roomId)}`;
  }

  return getRoomPageUrl(roomId);
};
