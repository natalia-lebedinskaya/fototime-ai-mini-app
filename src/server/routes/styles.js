const express = require('express');

const router = express.Router();

const CYBERPHOTOBOOTH_PUBLIC_STYLES_URL =
  process.env.CYBERPHOTOBOOTH_PUBLIC_STYLES_URL ||
  'https://api.cyberphotobooth.ru/api/public/styles';

const STYLE_LIMIT = 0;
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
      source: 'cyberphotobooth-public-catalog'
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
