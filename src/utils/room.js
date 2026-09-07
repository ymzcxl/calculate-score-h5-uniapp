const ROOM_ID_TOKEN_PATTERN = /^[A-Za-z0-9_-]{4,64}$/;

const trimPunctuation = (value) => String(value || '')
  .trim()
  .replace(/^[\s"'“”‘’<>《》「」『』【】\[\]{}()（）,，。!！?？:：;；]+/g, '')
  .replace(/[\s"'“”‘’<>《》「」『』【】\[\]{}()（）,，。!！?？:：;；]+$/g, '');

const decodeText = (value) => {
  let current = String(value || '').replace(/\u3000/g, ' ').trim();
  for (let index = 0; index < 2; index += 1) {
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) {
        break;
      }
      current = decoded;
    } catch (error) {
      break;
    }
  }
  return current;
};

const normalizeCandidate = (value) => trimPunctuation(decodeText(value));

const isValidRoomIdToken = (value) => ROOM_ID_TOKEN_PATTERN.test(value);

const pickValidRoomId = (...candidates) => {
  for (const candidate of candidates) {
    const normalized = normalizeCandidate(candidate);
    if (isValidRoomIdToken(normalized)) {
      return normalized;
    }
  }
  return '';
};

const extractRoomIdFromParams = (text) => {
  const match = text.match(/(?:^|[?&#\s])roomId=([^&#\s]+)/i);
  return pickValidRoomId(match?.[1]);
};

const extractRoomIdFromLabels = (text) => {
  const match = text.match(/(?:房间号|房号|room\s*id|roomId)\s*[:：=]?\s*([A-Za-z0-9_-]{4,64})/i);
  return pickValidRoomId(match?.[1]);
};

const extractRoomIdFromKnownPattern = (text) => {
  const match = text.match(/\b(room_[A-Za-z0-9]+)\b/i);
  return pickValidRoomId(match?.[1]);
};

export const extractRoomId = (value) => {
  if (!value) {
    return '';
  }

  const normalized = decodeText(value);
  const roomId = extractRoomIdFromParams(normalized)
    || extractRoomIdFromLabels(normalized)
    || extractRoomIdFromKnownPattern(normalized);

  if (roomId) {
    return roomId;
  }

  const compact = normalizeCandidate(normalized.replace(/\s+/g, ''));
  return isValidRoomIdToken(compact) ? compact : '';
};
