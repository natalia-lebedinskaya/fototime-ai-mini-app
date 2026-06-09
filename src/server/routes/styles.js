const express = require('express');

const router = express.Router();

const PARTICIPANTS = ['male', 'female', 'couple', 'boy', 'girl', 'family'];

const STYLES = [
  {
    id: 'ns-astral',
    title: 'Астрал',
    name: 'Астрал',
    network: 'SDXL',
    category: 'Фэнтези',
    participant: PARTICIPANTS,
    imageUrl: null,
    previewUrl: null,
    thumbnail: null
  },
  {
    id: 'ns-valentine-01',
    title: 'Кафтаны',
    name: 'Кафтаны',
    network: 'SDXL',
    category: 'Портрет',
    participant: PARTICIPANTS,
    imageUrl: null,
    previewUrl: null,
    thumbnail: null
  },
  {
    id: 'ns-spring-city',
    title: 'Весенний город',
    name: 'Весенний город',
    network: 'SDXL',
    category: 'Городской стиль',
    participant: PARTICIPANTS,
    imageUrl: null,
    previewUrl: null,
    thumbnail: null
  },
  {
    id: 'ns-dryad-01',
    title: 'Дриада',
    name: 'Дриада',
    network: 'SDXL',
    category: 'Фэнтези',
    participant: PARTICIPANTS,
    imageUrl: null,
    previewUrl: null,
    thumbnail: null
  },
  {
    id: 'ns-hogwarts-stairs',
    title: 'Хогвартс',
    name: 'Хогвартс',
    network: 'SDXL',
    category: 'Магический стиль',
    participant: PARTICIPANTS,
    imageUrl: null,
    previewUrl: null,
    thumbnail: null
  },
  {
    id: 'comic',
    title: 'Комикс',
    name: 'Комикс',
    network: 'SDXL',
    category: 'Иллюстрация',
    participant: PARTICIPANTS,
    imageUrl: null,
    previewUrl: null,
    thumbnail: null
  }
];

router.get('/', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({
    styles: STYLES,
    items: STYLES,
    count: STYLES.length,
    source: 'real-mapped-local-styles-no-previews'
  });
});

router.get('/public', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({
    styles: STYLES,
    items: STYLES,
    count: STYLES.length,
    source: 'real-mapped-local-styles-no-previews'
  });
});

module.exports = router;
