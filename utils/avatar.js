const AVATAR_STYLES = [
  {
    palette: 'powder blue and cotton pink',
    subject: 'rounded smiling mascot face'
  },
  {
    palette: 'butter yellow and peach cream',
    subject: 'playful dice character portrait'
  },
  {
    palette: 'mint green and sky blue',
    subject: 'soft geometric badge avatar'
  },
  {
    palette: 'lavender and strawberry milk',
    subject: 'cute abstract card suit emblem'
  },
  {
    palette: 'apricot orange and blush pink',
    subject: 'friendly lucky token portrait'
  },
  {
    palette: 'seafoam green and lilac',
    subject: 'minimal jelly bean mascot'
  }
];

const hashSeed = (seed = '') => {
  let hash = 0;
  const normalized = String(seed || 'macaron-player');
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const buildAvatarPrompt = (seed = '') => {
  const hash = hashSeed(seed);
  const style = AVATAR_STYLES[hash % AVATAR_STYLES.length];
  return [
    `${style.subject}, avatar icon for a casual card scoring app`,
    `${style.palette} pastel macaron palette`,
    'flat illustration, rounded edges, soft highlight',
    'clean background, centered composition, high contrast, no text'
  ].join(', ');
};

export const createDefaultAvatar = (seed = '') => {
  const prompt = encodeURIComponent(buildAvatarPrompt(seed));
  return `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${prompt}&image_size=square`;
};

export const resolveAvatarUrl = (user = {}) => {
  if (user?.avatarUrl) return user.avatarUrl;
  const seed = [user?.uid, user?.phone, user?.nickName].filter(Boolean).join('|');
  return createDefaultAvatar(seed);
};
