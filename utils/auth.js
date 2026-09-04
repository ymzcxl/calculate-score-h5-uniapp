const PENDING_REDIRECT_KEY = 'pending_redirect_url';

const normalizePageUrl = (url) => {
  if (!url) {
    return '/pages/login/login';
  }

  const normalized = String(url).trim();
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
};

const buildHashUrl = (url) => {
  const target = normalizePageUrl(url);

  if (typeof window === 'undefined' || !window.location) {
    return target;
  }

  const { pathname, search } = window.location;
  return `${pathname}${search}#${target}`;
};

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

export const navigateToPage = (url) => {
  const target = normalizePageUrl(url);
  if (typeof window !== 'undefined' && window.location) {
    window.location.hash = target;
    return;
  }

  uni.navigateTo({ url: target });
};

export const reLaunchPage = (url) => {
  const target = normalizePageUrl(url);
  if (typeof window !== 'undefined' && window.location) {
    window.location.replace(buildHashUrl(target));
    return;
  }

  uni.reLaunch({ url: target });
};

export const navigateBackOrPage = (fallbackUrl) => {
  if (typeof window !== 'undefined' && window.history) {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
  } else {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      uni.navigateBack({ delta: 1 });
      return;
    }
  }

  reLaunchPage(fallbackUrl);
};

export const redirectToLogin = (url) => {
  savePendingRedirect(url);
  reLaunchPage('/pages/login/login');
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
