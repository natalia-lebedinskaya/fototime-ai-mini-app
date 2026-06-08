const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

function svgData(title, bg = '#161b22', accent = '#b8ff1d') {
  const safe = String(title || 'FOTOTIME AI')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="720" height="960" viewBox="0 0 720 960">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${bg}"/>
        <stop offset="1" stop-color="#2b3338"/>
      </linearGradient>
      <radialGradient id="r" cx="35%" cy="30%" r="70%">
        <stop offset="0" stop-color="${accent}" stop-opacity=".95"/>
        <stop offset=".38" stop-color="#5eead4" stop-opacity=".65"/>
        <stop offset="1" stop-color="#111827" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="720" height="960" fill="url(#g)"/>
    <rect width="720" height="960" fill="url(#r)"/>
    <circle cx="180" cy="210" r="90" fill="${accent}" opacity=".88"/>
    <circle cx="515" cy="270" r="120" fill="#5eead4" opacity=".55"/>
    <circle cx="360" cy="520" r="190" fill="#7c3aed" opacity=".68"/>
    <rect x="135" y="690" width="450" height="62" rx="31" fill="rgba(255,255,255,.2)"/>
    <text x="360" y="115" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="#ffffff">FOTOTIME AI</text>
    <text x="360" y="735" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="#ffffff">${safe}</text>
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const FALLBACK_STYLES = [
  { id: 'ns-atlantis', title: 'Атлантида', name: 'Атлантида', network: 'SDXL', model: 'SDXL', image: svgData('Атлантида', '#062536') },
  { id: 'ns-barbie', title: 'Барби', name: 'Барби', network: 'SDXL', model: 'SDXL', image: svgData('Барби', '#32111f', '#ff77c8') },
  { id: 'ns-bubblegum', title: 'Баблгам', name: 'Баблгам', network: 'SDXL', model: 'SDXL', image: svgData('Баблгам', '#20142f', '#ff5fa2') },
  { id: 'ns-business', title: 'Бизнес', name: 'Бизнес', network: 'SDXL', model: 'SDXL', image: svgData('Бизнес', '#111827', '#38bdf8') },
  { id: 'ns-christmas', title: 'Рождество', name: 'Рождество', network: 'SDXL', model: 'SDXL', image: svgData('Рождество', '#102018', '#b8ff1d') },
  { id: 'ns-comics', title: 'Комикс', name: 'Комикс', network: 'SDXL', model: 'SDXL', image: svgData('Комикс', '#25110c', '#facc15') }
];

function findStylesFile() {
  const candidates = [
    path.join(process.cwd(), 'public-styles.json'),
    path.join(process.cwd(), 'styles.json'),
    path.join(process.cwd(), 'public', 'public-styles.json'),
    path.join(process.cwd(), 'public', 'styles.json'),
    path.join(process.cwd(), 'src', 'client', 'public-styles.json'),
    path.join(process.cwd(), 'src', 'client', 'styles.json'),
    path.join(process.cwd(), 'src', 'client', 'assets', 'public-styles.json'),
    path.join(process.cwd(), 'src', 'client', 'assets', 'styles.json')
  ];

  return candidates.find((filePath) => fs.existsSync(filePath));
}

function normalizeImage(value, title) {
  const image = String(value || '').trim();

  if (!image) return svgData(title);
  if (image.startsWith('data:')) return image;
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  if (image.startsWith('/')) return image;

  return `/${image.replace(/^\.?\//, '')}`;
}

function normalizeStyle(style, index) {
  const id = String(style.id || style.styleId || style.slug || style.code || `style-${index + 1}`);
  const title = String(style.title || style.name || style.label || id);
  const network = String(style.network || style.model || style.neuralNetwork || 'SDXL');

  const image = normalizeImage(
    style.image ||
    style.preview ||
    style.previewUrl ||
    style.thumb ||
    style.thumbnail ||
    style.url ||
    style.cover ||
    style.coverUrl,
    title
  );

  return {
    ...style,
    id,
    styleId: style.styleId || id,
    title,
    name: style.name || title,
    label: style.label || title,
    network,
    model: style.model || network,
    image,
    preview: normalizeImage(style.preview || style.previewUrl || image, title),
    thumb: normalizeImage(style.thumb || style.thumbnail || image, title),
    thumbnail: normalizeImage(style.thumbnail || style.thumb || image, title),
    participantTypes: style.participantTypes || style.participants || ['male', 'female', 'couple', 'boy', 'girl', 'family'],
    gender: style.gender || 'all'
  };
}

function extractList(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.styles)) return parsed.styles;
  if (Array.isArray(parsed.items)) return parsed.items;
  if (Array.isArray(parsed.data)) return parsed.data;
  if (parsed.data && Array.isArray(parsed.data.styles)) return parsed.data.styles;
  if (parsed.result && Array.isArray(parsed.result.styles)) return parsed.result.styles;
  return [];
}

function loadStyles() {
  const filePath = findStylesFile();

  if (!filePath) {
    return FALLBACK_STYLES.map(normalizeStyle);
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    const list = extractList(parsed);

    if (!list.length) {
      return FALLBACK_STYLES.map(normalizeStyle);
    }

    return list.map(normalizeStyle);
  } catch (error) {
    console.error('[styles] Failed to read styles file:', error.message);
    return FALLBACK_STYLES.map(normalizeStyle);
  }
}

function sendStyles(req, res) {
  const styles = loadStyles();

  res.setHeader('Cache-Control', 'no-store');
  res.json({
    ok: true,
    count: styles.length,
    styles,
    items: styles,
    data: styles
  });
}

router.get('/', sendStyles);
router.get('/public', sendStyles);

module.exports = router;
