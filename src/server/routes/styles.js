const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const FALLBACK_STYLES = [
  {
    id: 'ns-atlantis',
    title: 'Атлантида',
    name: 'Атлантида',
    network: 'SDXL',
    model: 'SDXL',
    participantTypes: ['male', 'female', 'couple', 'boy', 'girl', 'family'],
    gender: 'all',
    image: '/assets/styles/atlantis.jpg',
    preview: '/assets/styles/atlantis.jpg',
    thumb: '/assets/styles/atlantis.jpg'
  },
  {
    id: 'ns-barbie',
    title: 'Барби',
    name: 'Барби',
    network: 'SDXL',
    model: 'SDXL',
    participantTypes: ['male', 'female', 'couple', 'boy', 'girl', 'family'],
    gender: 'all',
    image: '/assets/styles/barbie.jpg',
    preview: '/assets/styles/barbie.jpg',
    thumb: '/assets/styles/barbie.jpg'
  },
  {
    id: 'ns-bubblegum',
    title: 'Баблгам',
    name: 'Баблгам',
    network: 'SDXL',
    model: 'SDXL',
    participantTypes: ['male', 'female', 'couple', 'boy', 'girl', 'family'],
    gender: 'all',
    image: '/assets/styles/bubblegum.jpg',
    preview: '/assets/styles/bubblegum.jpg',
    thumb: '/assets/styles/bubblegum.jpg'
  },
  {
    id: 'ns-business',
    title: 'Бизнес',
    name: 'Бизнес',
    network: 'SDXL',
    model: 'SDXL',
    participantTypes: ['male', 'female', 'couple', 'boy', 'girl', 'family'],
    gender: 'all',
    image: '/assets/styles/business.jpg',
    preview: '/assets/styles/business.jpg',
    thumb: '/assets/styles/business.jpg'
  },
  {
    id: 'ns-christmas',
    title: 'Рождество',
    name: 'Рождество',
    network: 'SDXL',
    model: 'SDXL',
    participantTypes: ['male', 'female', 'couple', 'boy', 'girl', 'family'],
    gender: 'all',
    image: '/assets/styles/christmas.jpg',
    preview: '/assets/styles/christmas.jpg',
    thumb: '/assets/styles/christmas.jpg'
  },
  {
    id: 'ns-comics',
    title: 'Комикс',
    name: 'Комикс',
    network: 'SDXL',
    model: 'SDXL',
    participantTypes: ['male', 'female', 'couple', 'boy', 'girl', 'family'],
    gender: 'all',
    image: '/assets/styles/comics.jpg',
    preview: '/assets/styles/comics.jpg',
    thumb: '/assets/styles/comics.jpg'
  }
];

function findStylesFile() {
  const candidates = [
    path.join(process.cwd(), 'public-styles.json'),
    path.join(process.cwd(), 'styles.json'),
    path.join(process.cwd(), 'public', 'public-styles.json'),
    path.join(process.cwd(), 'public', 'styles.json'),
    path.join(process.cwd(), 'src', 'client', 'public-styles.json'),
    path.join(process.cwd(), 'src', 'client', 'assets', 'public-styles.json'),
    path.join(process.cwd(), 'src', 'client', 'assets', 'styles.json')
  ];

  return candidates.find((filePath) => fs.existsSync(filePath));
}

function normalizeStyle(style, index) {
  const id = String(
    style.id ||
    style.styleId ||
    style.slug ||
    style.code ||
    `style-${index + 1}`
  );

  const title = String(
    style.title ||
    style.name ||
    style.label ||
    id
  );

  const image = String(
    style.image ||
    style.preview ||
    style.thumb ||
    style.thumbnail ||
    style.url ||
    ''
  );

  return {
    ...style,
    id,
    styleId: style.styleId || id,
    title,
    name: style.name || title,
    label: style.label || title,
    network: style.network || style.model || 'SDXL',
    model: style.model || style.network || 'SDXL',
    image,
    preview: style.preview || image,
    thumb: style.thumb || image,
    thumbnail: style.thumbnail || image,
    participantTypes: style.participantTypes || style.participants || ['male', 'female', 'couple', 'boy', 'girl', 'family'],
    gender: style.gender || 'all'
  };
}

function loadStyles() {
  const filePath = findStylesFile();

  if (!filePath) {
    return FALLBACK_STYLES;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);

    const list = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.styles)
        ? parsed.styles
        : Array.isArray(parsed.items)
          ? parsed.items
          : Array.isArray(parsed.data)
            ? parsed.data
            : [];

    if (!list.length) {
      return FALLBACK_STYLES;
    }

    return list.map(normalizeStyle);
  } catch (error) {
    console.error('[styles] Failed to read styles file:', error.message);
    return FALLBACK_STYLES;
  }
}

function sendStyles(req, res) {
  const styles = loadStyles();

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
