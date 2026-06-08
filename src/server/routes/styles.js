const express = require('express');

const router = express.Router();

const STYLES = [
  {
    id: 'atlantida',
    title: 'Атлантида',
    name: 'Атлантида',
    network: 'SDXL',
    category: 'SDXL',
    participant: ['male', 'female', 'couple', 'boy', 'girl', 'family'],
    imageUrl: '/assets/styles/ns-astral.svg',
    previewUrl: '/assets/styles/ns-astral.svg',
    thumbnail: '/assets/styles/ns-astral.svg'
  },
  {
    id: 'barbie',
    title: 'Барби',
    name: 'Барби',
    network: 'SDXL',
    category: 'SDXL',
    participant: ['male', 'female', 'couple', 'boy', 'girl', 'family'],
    imageUrl: '/assets/styles/ns-valentine-01.svg',
    previewUrl: '/assets/styles/ns-valentine-01.svg',
    thumbnail: '/assets/styles/ns-valentine-01.svg'
  },
  {
    id: 'bubblegum',
    title: 'Баблгам',
    name: 'Баблгам',
    network: 'SDXL',
    category: 'SDXL',
    participant: ['male', 'female', 'couple', 'boy', 'girl', 'family'],
    imageUrl: '/assets/styles/ns-spring-city.svg',
    previewUrl: '/assets/styles/ns-spring-city.svg',
    thumbnail: '/assets/styles/ns-spring-city.svg'
  },
  {
    id: 'business',
    title: 'Бизнес',
    name: 'Бизнес',
    network: 'SDXL',
    category: 'SDXL',
    participant: ['male', 'female', 'couple', 'boy', 'girl', 'family'],
    imageUrl: '/assets/styles/ns-dryad-01.svg',
    previewUrl: '/assets/styles/ns-dryad-01.svg',
    thumbnail: '/assets/styles/ns-dryad-01.svg'
  },
  {
    id: 'christmas',
    title: 'Рождество',
    name: 'Рождество',
    network: 'SDXL',
    category: 'SDXL',
    participant: ['male', 'female', 'couple', 'boy', 'girl', 'family'],
    imageUrl: '/assets/styles/ns-hogwarts-stairs.svg',
    previewUrl: '/assets/styles/ns-hogwarts-stairs.svg',
    thumbnail: '/assets/styles/ns-hogwarts-stairs.svg'
  },
  {
    id: 'comic',
    title: 'Комикс',
    name: 'Комикс',
    network: 'SDXL',
    category: 'SDXL',
    participant: ['male', 'female', 'couple', 'boy', 'girl', 'family'],
    imageUrl: '/assets/mock-result.svg',
    previewUrl: '/assets/mock-result.svg',
    thumbnail: '/assets/mock-result.svg'
  }
];

router.get('/', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({
    styles: STYLES,
    items: STYLES,
    count: STYLES.length,
    source: 'stable-local-styles'
  });
});

router.get('/public', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({
    styles: STYLES,
    items: STYLES,
    count: STYLES.length,
    source: 'stable-local-styles'
  });
});

module.exports = router;
