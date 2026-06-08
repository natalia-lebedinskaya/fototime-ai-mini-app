
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const FALLBACK_STYLES = [
  {
    id: 'atlantida',
    title: 'Атлантида',
    name: 'Атлантида',
    network: 'SDXL',
    category: 'SDXL',
    participant: ['male', 'female', 'couple', 'boy', 'girl', 'family'],
    imageUrl: '/assets/style-atlantida.jpg',
    previewUrl: '/assets/style-atlantida.jpg',
    thumbnail: '/assets/style-atlantida.jpg'
  },
  {
    id: 'barbie',
    title: 'Барби',
    name: 'Барби',
    network: 'SDXL',
    category: 'SDXL',
    participant: ['male', 'female', 'couple', 'boy', 'girl', 'family'],
    imageUrl: '/assets/style-barbie.jpg',
    previewUrl: '/assets/style-barbie.jpg',
    thumbnail: '/assets/style-barbie.jpg'
  },
  {
    id: 'bubblegum',
    title: 'Баблгам',
    name: 'Баблгам',
    network: 'SDXL',
    category: 'SDXL',
    participant: ['male', 'female', 'couple', 'boy', 'girl', 'family'],
    imageUrl: '/assets/style-bubblegum.jpg',
    previewUrl: '/assets/style-bubblegum.jpg',
    thumbnail: '/assets/style-bubblegum.jpg'
  },
  {
    id: 'business',
    title: 'Бизнес',
    name: 'Бизнес',
    network: 'SDXL',
    category: 'SDXL',
    participant: ['male', 'female', 'couple', 'boy', 'girl', 'family'],
    imageUrl: '/assets/style-business.jpg',
    previewUrl: '/assets/style-business.jpg',
    thumbnail: '/assets/style-business.jpg'
  },
  {
    id: 'christmas',
    title: 'Рождество',
    name: 'Рождество',
    network: 'SDXL',
    category: 'SDXL',
    participant: ['male', 'female', 'couple', 'boy', 'girl', 'family'],
    imageUrl: '/assets/style-christmas.jpg',
    previewUrl: '/assets/style-christmas.jpg',
    thumbnail: '/assets/style-christmas.jpg'
  },
  {
    id: 'comic',
    title: 'Комикс',
    name: 'Комикс',
    network: 'SDXL',
    category: 'SDXL',
    participant: ['male', 'female', 'couple', 'boy', 'girl', 'family'],
    imageUrl: '/assets/style-comic.jpg',
    previewUrl: '/assets/style-comic.jpg',
    thumbnail: '/assets/style-comic.jpg'
  }
];

const STYLE_FILE_CANDIDATES = [
  path.join(process.cwd(), 'public', 'public-styles.json'),
  path.join(process.cwd(), 'public-styles.json'),
  path.join(process.cwd(), 'src', 'client', 'public-styles.json'),
  path.join(process.cwd(), 'src', 'client', 'assets', 'public-styles.json'),
  path.join(process.cwd(), 'src', 'server', 'data', 'public-styles.json'),
  path.join(process.cwd(), 'storage', 'public-styles.json')
];

function unwrapStyles(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.styles)) return payload.styles;
  if (payload && Array.isArray(payload.items)) return payload.items;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

function cleanUrl(value) {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  return '/' + trimmed.replace(/^\.?\//, '');
}

function normalizeStyle(style, index) {
  const title =
    style.title ||
    style.name ||
    style.label ||
    style.styleName ||
    style.displayName ||
    `Стиль ${index + 1}`;

  const id =
    style.id ||
    style.slug ||
    style.code ||
    style.key ||
    String(title).toLowerCase().replace(/\s+/g, '-');

  const image =
    style.imageUrl ||
    style.previewUrl ||
    style.thumbnail ||
    style.image ||
    style.cover ||
    style.icon ||
    style.url ||
    style.src ||
    '';

  return {
    ...style,
    id,
    title,
    name: title,
    network: style.network || style.model || style.category || 'SDXL',
    category: style.category || style.network || style.model || 'SDXL',
    imageUrl: cleanUrl(image),
    previewUrl: cleanUrl(image),
    thumbnail: cleanUrl(image)
  };
}

function loadStylesFromDisk() {
  for (const file of STYLE_FILE_CANDIDATES) {
    try {
      if (!fs.existsSync(file)) continue;
      const raw = fs.readFileSync(file, 'utf-8');
      const parsed = JSON.parse(raw);
      const list = unwrapStyles(parsed).map(normalizeStyle).filter(Boolean);
      if (list.length) return list;
    } catch (error) {
      console.error('[styles] failed to read', file, error.message);
    }
  }

  return FALLBACK_STYLES.map(normalizeStyle);
}

function sendStyles(req, res) {
  const styles = loadStylesFromDisk();

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.status(200).json({
    styles,
    items: styles,
    data: styles,
    count: styles.length,
    source: 'fototime-stable'
  });
}

router.get('/', sendStyles);
router.get('/public', sendStyles);
router.get('/config', sendStyles);
router.get('/event', sendStyles);

module.exports = router;
