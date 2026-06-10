const express = require('express');

const router = express.Router();

const CYBERPHOTOBOOTH_PUBLIC_STYLES_URL =
  process.env.CYBERPHOTOBOOTH_PUBLIC_STYLES_URL ||
  'https://api.cyberphotobooth.ru/api/public/styles';

const STYLE_LIMIT = Number(process.env.CYBERPHOTOBOOTH_STYLE_LIMIT || 90);
const PARTICIPANTS = ['male', 'female', 'couple', 'boy', 'girl', 'family'];

let cachedStyles = [];
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

function normalizeMode(mode) {
  if (!mode) return null;

  if (typeof mode === 'string') {
    return {
      name: mode,
      displayName: mode,
      display_name: mode
    };
  }

  const name =
    mode.name ||
    mode.id ||
    mode.mode ||
    mode.value ||
    '';

  const displayName =
    mode.display_name ||
    mode.displayName ||
    mode.title ||
    mode.label ||
    name;

  if (!name && !displayName) return null;

  return {
    name: String(name || displayName),
    displayName: String(displayName || name),
    display_name: String(displayName || name)
  };
}

function getPreviewUrl(style) {
  return (
    style.preview_url ||
    style.previewUrl ||
    style.preview_url_thumb ||
    style.preview_thumb_url ||
    style.thumbnail_url ||
    style.thumbnailUrl ||
    style.thumbnail ||
    style.image_url ||
    style.imageUrl ||
    style.cover_url ||
    style.coverUrl ||
    style.assets?.[0]?.url ||
    style.assets?.[0]?.webp_url ||
    style.assets?.[0]?.webpUrl ||
    null
  );
}

function normalizeCyberStyle(style) {
  const id = String(style.style_id || style.id || style.slug || '').trim();

  const title =
    style.display_name_ru ||
    style.displayNameRu ||
    style.display_name_en ||
    style.displayNameEn ||
    style.name ||
    style.title ||
    id;

  const modes = Array.isArray(style.modes)
    ? style.modes.map(normalizeMode).filter(Boolean)
    : [];

  const previewUrl = getPreviewUrl(style);
  const primaryMode = modes[0] || {
    name: 'style_sdxl_zero',
    displayName: 'SDXL',
    display_name: 'SDXL'
  };

  return {
    id,
    providerStyleId: id,
    title,
    name: title,
    displayNameRu: style.display_name_ru || style.displayNameRu || title,
    displayNameEn: style.display_name_en || style.displayNameEn || title,
    network: primaryMode.displayName || primaryMode.display_name || primaryMode.name || 'CyberPhotoBooth',
    category: primaryMode.displayName || primaryMode.display_name || primaryMode.name || 'CyberPhotoBooth',
    participant: PARTICIPANTS,
    participantType: null,
    isAvailable: true,
    imageUrl: previewUrl,
    previewUrl,
    thumbnail: previewUrl,
    modes: modes.length ? modes : [primaryMode],
    source: 'cyberphotobooth-public-catalog'
  };
}

function fallbackStyles() {
  return [
    {
      id: '1002',
      providerStyleId: '1002',
      title: 'Атлантида',
      name: 'Атлантида',
      displayNameRu: 'Атлантида',
      displayNameEn: 'Atlantis',
      network: 'SDXL',
      category: 'SDXL',
      participant: PARTICIPANTS,
      participantType: null,
      isAvailable: true,
      imageUrl: null,
      previewUrl: null,
      thumbnail: null,
      modes: [{ name: 'style_sdxl_zero', displayName: 'SDXL', display_name: 'SDXL' }],
      source: 'fallback'
    }
  ];
}

async function loadStyles() {
  const now = Date.now();

  if (cachedStyles.length && now - cachedAt < CACHE_TTL_MS) {
    return cachedStyles;
  }

  const response = await fetch(CYBERPHOTOBOOTH_PUBLIC_STYLES_URL);

  if (!response.ok) {
    throw new Error(`CyberPhotoBooth public styles failed: ${response.status}`);
  }

  const data = await response.json();

  const rawStyles = Array.isArray(data)
    ? data
    : data.styles || data.items || data.data?.styles || data.data || [];

  let styles = rawStyles
    .map(normalizeCyberStyle)
    .filter((style) => style.id && style.title);

  if (STYLE_LIMIT > 0) {
    styles = ftCurateStylesForClient(styles, STYLE_LIMIT);
  }

  cachedStyles = styles.length ? styles : fallbackStyles();
  cachedAt = now;

  return cachedStyles;
}

async function sendStyles(_req, res) {
  try {
    const styles = await loadStyles();

    res.set('Cache-Control', 'no-store');
    res.json({
      styles,
      items: styles,
      count: styles.length,
      source: 'cyberphotobooth-public-catalog',
      limit: STYLE_LIMIT
    });
  } catch (error) {
    console.error('Styles catalog error:', error);

    const styles = cachedStyles.length ? cachedStyles : fallbackStyles();

    res.set('Cache-Control', 'no-store');
    res.json({
      styles,
      items: styles,
      count: styles.length,
      source: 'fallback-after-cyberphotobooth-error',
      error: error.message
    });
  }
}



/* FT_PRODUCT_LITE_SERVER_STYLE_CURATOR_20260610_START */
function ftGetStyleModeName(style) {
  const modes = Array.isArray(style?.modes) ? style.modes : [];
  const mode = modes[0] || {};
  const raw =
    style?.styleMode ||
    style?.mode ||
    style?.network ||
    mode?.displayName ||
    mode?.display_name ||
    mode?.name ||
    mode?.id ||
    '';

  const text = String(raw).trim().toLowerCase();

  if (text.includes('nano banana 2') || text.includes('nano-banana2')) return 'Nano Banana 2';
  if (text.includes('nano banana') || text.includes('nano-banana')) return 'Nano Banana';
  if (text.includes('flux.2') || text.includes('flux2') || text.includes('edit2')) return 'FLUX.2';
  if (text.includes('headswap') || text.includes('замена')) return 'Замена Головы';
  if (text.includes('sdxl') || text.includes('style_sdxl_zero')) return 'SDXL';

  return raw || 'Другое';
}

function ftCurateStylesForClient(styles, limit = 90) {
  if (!Array.isArray(styles)) return [];

  const safeLimit = Math.max(15, Math.min(Number(limit) || 90, 180));
  const preferredModes = ['SDXL', 'Nano Banana', 'FLUX.2', 'Nano Banana 2', 'Замена Головы'];

  const groups = new Map();

  styles.forEach((style) => {
    const mode = ftGetStyleModeName(style);
    if (!groups.has(mode)) groups.set(mode, []);
    groups.get(mode).push(style);
  });

  const result = [];
  const perPreferredMode = Math.max(8, Math.floor(safeLimit / Math.max(preferredModes.length, 1)));

  preferredModes.forEach((mode) => {
    const group = groups.get(mode) || [];
    group.slice(0, perPreferredMode).forEach((style) => result.push(style));
  });

  styles.forEach((style) => {
    if (result.length >= safeLimit) return;
    if (!result.includes(style)) result.push(style);
  });

  return result.slice(0, safeLimit);
}
/* FT_PRODUCT_LITE_SERVER_STYLE_CURATOR_20260610_END */
router.get('/', sendStyles);
router.get('/public', sendStyles);

module.exports = router;
