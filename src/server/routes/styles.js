const express = require('express');

const router = express.Router();

const CYBERPHOTOBOOTH_PUBLIC_STYLES_URL =
  process.env.CYBERPHOTOBOOTH_PUBLIC_STYLES_URL ||
  'https://api.cyberphotobooth.ru/api/public/styles';

const STYLE_LIMIT = Number(process.env.CYBERPHOTOBOOTH_STYLE_LIMIT || 60);

const PARTICIPANTS = ['male', 'female', 'couple', 'boy', 'girl', 'family'];

let cachedStyles = [];
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

function normalizeMode(mode) {
  if (!mode) return null;

  if (typeof mode === 'string') {
    return {
      name: mode,
      display_name: mode
    };
  }

  return {
    name: mode.name || mode.id || mode.mode || 'style_sdxl_zero',
    display_name: mode.display_name || mode.displayName || mode.name || mode.id || mode.mode || 'style_sdxl_zero'
  };
}

function normalizeCyberStyle(style) {
  const id = String(style.style_id || style.id || '').trim();

  const title =
    style.display_name_ru ||
    style.display_name_en ||
    style.name ||
    style.title ||
    id;

  const previewUrl =
    style.preview_url ||
    style.previewUrl ||
    style.preview_url_thumb ||
    style.thumbnail ||
    style.imageUrl ||
    style.assets?.[0]?.url ||
    style.assets?.[0]?.webp_url ||
    null;

  const modes = Array.isArray(style.modes)
    ? style.modes.map(normalizeMode).filter(Boolean)
    : [{ name: 'style_sdxl_zero', display_name: 'style_sdxl_zero' }];

  return {
    id,
    title,
    name: title,
    displayNameRu: style.display_name_ru || title,
    displayNameEn: style.display_name_en || title,
    network: 'CyberPhotoBooth',
    category: modes[0]?.display_name || modes[0]?.name || 'CyberPhotoBooth',
    participant: PARTICIPANTS,
    imageUrl: previewUrl,
    previewUrl,
    thumbnail: previewUrl,
    modes,
    providerStyleId: id,
    source: 'cyberphotobooth-public-catalog'
  };
}

function fallbackStyles() {
  return [
    {
      id: '1002',
      title: 'Атлантида',
      name: 'Атлантида',
      network: 'CyberPhotoBooth',
      category: 'style_sdxl_zero',
      participant: PARTICIPANTS,
      imageUrl: null,
      previewUrl: null,
      thumbnail: null,
      modes: [{ name: 'style_sdxl_zero', display_name: 'style_sdxl_zero' }],
      providerStyleId: '1002',
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

  const styles = rawStyles
    .map(normalizeCyberStyle)
    .filter((style) => style.id && style.title)
    .slice(0, STYLE_LIMIT);

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

router.get('/', sendStyles);
router.get('/public', sendStyles);

module.exports = router;
