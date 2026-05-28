const express = require('express');

const router = express.Router();

const DEFAULT_API_URL = 'https://api.cyberphotobooth.ru/api';

function getApiUrl() {
  return process.env.CYBERPHOTOBOOTH_API_URL || DEFAULT_API_URL;
}

function normalizeStyle(style) {
  return {
    id: String(style.style_id || style.id || style.name),
    name: style.name,
    displayNameRu: style.display_name_ru || style.display_name_en || style.name,
    displayNameEn: style.display_name_en || style.name,
    previewUrl: style.preview_url || style.preview_url_thumb || null,
    modes: style.modes || [],
    source: 'cyberphotobooth'
  };
}

router.get('/', async (req, res, next) => {
  try {
    const response = await fetch(`${getApiUrl()}/public/styles`);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        code: 'CYBERPHOTOBOOTH_STYLES_ERROR',
        message: 'Не удалось получить список стилей'
      });
    }

    const styles = Array.isArray(data)
      ? data.map(normalizeStyle)
      : [];

    return res.status(200).json({
      styles
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
