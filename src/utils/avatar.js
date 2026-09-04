const COLOR_THEMES = [
  { bg: '#FFF4F7', bgSoft: '#FFE4EC', blob: '#F9A8D4', shoulder: '#F472B6', hair: '#7C3F58', accent: '#BE185D' },
  { bg: '#F5FFF8', bgSoft: '#DCFCE7', blob: '#86EFAC', shoulder: '#4ADE80', hair: '#24543B', accent: '#15803D' },
  { bg: '#F3FBFF', bgSoft: '#DBEAFE', blob: '#93C5FD', shoulder: '#60A5FA', hair: '#31507C', accent: '#2563EB' },
  { bg: '#FFF9F1', bgSoft: '#FEF3C7', blob: '#FCD34D', shoulder: '#F59E0B', hair: '#7C5422', accent: '#D97706' },
  { bg: '#FAF5FF', bgSoft: '#E9D5FF', blob: '#C084FC', shoulder: '#A855F7', hair: '#5B3B7A', accent: '#7E22CE' },
  { bg: '#F2FBFA', bgSoft: '#CCFBF1', blob: '#5EEAD4', shoulder: '#14B8A6', hair: '#1F5B59', accent: '#0F766E' },
  { bg: '#FFF7F2', bgSoft: '#FED7AA', blob: '#FDBA74', shoulder: '#FB923C', hair: '#7A4A2C', accent: '#EA580C' },
  { bg: '#F7F7FF', bgSoft: '#E0E7FF', blob: '#A5B4FC', shoulder: '#818CF8', hair: '#3F4D86', accent: '#4F46E5' },
  { bg: '#FFF8FB', bgSoft: '#FBCFE8', blob: '#F9A8D4', shoulder: '#EC4899', hair: '#6B3652', accent: '#DB2777' },
  { bg: '#F4FFFE', bgSoft: '#BFDBFE', blob: '#7DD3FC', shoulder: '#38BDF8', hair: '#27546D', accent: '#0284C7' },
  { bg: '#FFFDF4', bgSoft: '#FDE68A', blob: '#FACC15', shoulder: '#EAB308', hair: '#6D5620', accent: '#CA8A04' },
  { bg: '#F7FFF7', bgSoft: '#BBF7D0', blob: '#4ADE80', shoulder: '#22C55E', hair: '#28543A', accent: '#16A34A' }
];

const FACE_COLORS = ['#FDE1D3', '#F7D6C2', '#F2CCB6', '#EABFA6', '#F6DBC9', '#EFC6AE'];
const HAIR_COLORS = ['#53372E', '#704C3D', '#3F4855', '#85586F', '#6E4F91', '#2D5A6D', '#7A5D3B', '#4D5B39'];
const DECOR_COLORS = ['#FFFFFF', '#FEF3C7', '#DBEAFE', '#FCE7F3', '#DCFCE7', '#EDE9FE'];

const HAIR_SHAPES = [
  ({ hair }) => `<path d="M46 78c0-28 24-50 50-50 30 0 54 22 54 50v18H46V78Z" fill="${hair}"/><path d="M58 77c8-11 22-18 38-18s30 7 38 18v11H58V77Z" fill="${hair}"/>`,
  ({ hair }) => `<path d="M42 82c3-31 26-54 55-54 31 0 55 22 55 54v13H42V82Z" fill="${hair}"/><path d="M54 62c7 11 20 19 38 19 15 0 25-5 36-15-5-20-24-34-47-34-22 0-40 11-49 30 10 5 15 6 22 0Z" fill="${hair}"/>`,
  ({ hair }) => `<circle cx="63" cy="65" r="18" fill="${hair}"/><circle cx="96" cy="52" r="26" fill="${hair}"/><circle cx="130" cy="67" r="18" fill="${hair}"/><rect x="48" y="65" width="96" height="34" rx="17" fill="${hair}"/>`,
  ({ hair }) => `<circle cx="60" cy="48" r="14" fill="${hair}"/><circle cx="132" cy="48" r="14" fill="${hair}"/><path d="M48 82c0-30 21-52 48-52s48 22 48 52v14H48V82Z" fill="${hair}"/>`,
  ({ hair, accent }) => `<path d="M44 80c0-30 23-52 52-52 28 0 52 22 52 52v16H44V80Z" fill="${hair}"/><path d="M56 48h80c8 0 14 6 14 14v10H42V62c0-8 6-14 14-14Z" fill="${accent}"/>`,
  ({ hair }) => `<path d="M45 82c0-29 21-52 51-52 30 0 51 23 51 52v15H45V82Z" fill="${hair}"/><path d="M50 86c13-4 25-18 25-38h42c0 17 8 31 24 39v10H50V86Z" fill="${hair}"/>`,
  ({ hair }) => `<path d="M44 86c0-33 26-58 56-58 24 0 39 10 50 30l-14 7c-4-10-17-18-34-18-20 0-38 12-46 30l-12 9Z" fill="${hair}"/><path d="M48 82c0-19 20-34 48-34 23 0 42 10 48 24v24H48V82Z" fill="${hair}"/>`,
  ({ hair, accent }) => `<path d="M42 84c0-30 24-54 54-54 26 0 48 16 54 39l-13 1v28H55V71l-13-1c4-23 24-40 50-40-24 3-42 23-42 47v7Z" fill="${hair}"/><path d="M58 38h76l9 28H49l9-28Z" fill="${accent}"/>`
];

const ACCESSORY_SHAPES = [
  () => '',
  ({ accent, decor }) => `<path d="M131 85c9 0 16 7 16 16 0 9-7 16-16 16-8 0-15-7-15-16 0-9 7-16 15-16Z" fill="${accent}"/><path d="M127 91h8v20h-8zM121 97h20v8h-20z" fill="${decor}"/>`,
  ({ accent, decor }) => `<circle cx="74" cy="100" r="12" fill="none" stroke="${accent}" stroke-width="5"/><circle cx="118" cy="100" r="12" fill="none" stroke="${accent}" stroke-width="5"/><path d="M86 100h20" stroke="${accent}" stroke-width="5" stroke-linecap="round"/><path d="M132 100h10" stroke="${accent}" stroke-width="5" stroke-linecap="round"/><path d="M50 100h12" stroke="${accent}" stroke-width="5" stroke-linecap="round"/><circle cx="74" cy="100" r="4" fill="${decor}"/><circle cx="118" cy="100" r="4" fill="${decor}"/>`,
  ({ accent, decor }) => `<path d="M96 42l12 10-12 10-12-10 12-10Z" fill="${accent}"/><path d="M86 52l-12 10 12 10V52Zm20 0 12 10-12 10V52Z" fill="${decor}"/>`,
  ({ accent, decor }) => `<path d="M60 60c0-8 7-15 15-15 9 0 16 7 16 15 0 8-7 15-16 15-8 0-15-7-15-15Z" fill="${accent}"/><path d="M75 43l4 9 10 1-8 6 3 10-9-5-9 5 3-10-8-6 10-1 4-9Z" fill="${decor}"/>`,
  ({ accent, decor }) => `<path d="M54 150c8-8 21-13 42-13s34 5 42 13v14H54v-14Z" fill="${accent}"/><path d="M62 155c7-5 18-8 34-8s27 3 34 8" stroke="${decor}" stroke-width="5" stroke-linecap="round"/>`
];

const MOUTH_SHAPES = [
  ({ accent }) => `<path d="M82 123c4 5 9 7 14 7s10-2 14-7" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>`,
  ({ accent }) => `<path d="M82 124c5 2 9 3 14 3s9-1 14-3" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>`,
  ({ accent }) => `<path d="M82 126c4-5 9-8 14-8s10 3 14 8" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>`,
  ({ accent }) => `<path d="M80 123c5 8 11 11 16 11s11-3 16-11" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>`,
  ({ accent }) => `<path d="M86 126h20" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>`
];

const hashSeed = (seed = '') => {
  let hash = 0;
  const normalized = String(seed || 'macaron-player');
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const isGeneratedAvatarUrl = (value = '') => String(value || '').includes('coresg-normal.trae.ai/api/ide/v1/text_to_image');

const pickByHash = (list, hash, shift = 0) => list[(hash >>> shift) % list.length];

const buildAvatarSvg = (seed = '') => {
  const hash = hashSeed(seed);
  const theme = pickByHash(COLOR_THEMES, hash, 0);
  const hair = pickByHash(HAIR_COLORS, hash, 4);
  const face = pickByHash(FACE_COLORS, hash, 8);
  const decor = pickByHash(DECOR_COLORS, hash, 12);
  const hairShape = pickByHash(HAIR_SHAPES, hash, 16);
  const accessoryShape = pickByHash(ACCESSORY_SHAPES, hash, 20);
  const mouthShape = pickByHash(MOUTH_SHAPES, hash, 24);
  const eyeOffset = 1 + ((hash >>> 28) % 4);
  const blobShiftX = -8 + ((hash >>> 6) % 17);
  const blobShiftY = -6 + ((hash >>> 10) % 13);
  const shoulderRadius = 34 + ((hash >>> 14) % 10);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
      <rect width="192" height="192" rx="56" fill="${theme.bg}"/>
      <circle cx="${148 + blobShiftX}" cy="${42 + blobShiftY}" r="42" fill="${theme.blob}" opacity="0.9"/>
      <circle cx="${52 - blobShiftX}" cy="${148 - blobShiftY}" r="30" fill="${theme.bgSoft}" opacity="0.92"/>
      <path d="M38 190c0-31 26-56 58-56s58 25 58 56H38Z" fill="${theme.shoulder}" opacity="0.96"/>
      <circle cx="96" cy="96" r="${shoulderRadius}" fill="${face}"/>
      ${hairShape({ hair, accent: theme.accent })}
      <circle cx="81" cy="${100 + eyeOffset}" r="4.6" fill="#243145"/>
      <circle cx="111" cy="${100 - eyeOffset}" r="4.6" fill="#243145"/>
      <circle cx="79.5" cy="${98 + eyeOffset}" r="1.4" fill="#FFFFFF" opacity="0.9"/>
      <circle cx="109.5" cy="${98 - eyeOffset}" r="1.4" fill="#FFFFFF" opacity="0.9"/>
      <ellipse cx="69" cy="114" rx="7" ry="4.5" fill="#F9B1BC" opacity="0.42"/>
      <ellipse cx="123" cy="114" rx="7" ry="4.5" fill="#F9B1BC" opacity="0.42"/>
      <path d="M95 108c1 2 1 4 0 6" stroke="#D38A7A" stroke-width="3.5" stroke-linecap="round"/>
      ${mouthShape({ accent: theme.accent })}
      ${accessoryShape({ accent: theme.accent, decor })}
    </svg>
  `.replace(/\s{2,}/g, ' ').trim();
};

export const createDefaultAvatar = (seed = '') => {
  const svg = buildAvatarSvg(seed);
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const resolveAvatarUrl = (user = {}) => {
  if (user?.avatarUrl && !isGeneratedAvatarUrl(user.avatarUrl)) return user.avatarUrl;
  const seed = [user?.uid, user?.phone, user?.nickName].filter(Boolean).join('|');
  return createDefaultAvatar(seed);
};
