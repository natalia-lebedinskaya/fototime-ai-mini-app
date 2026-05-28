const express = require('express');

const router = express.Router();

const DEFAULT_API_URL = 'https://api.cyberphotobooth.ru/api';
const STYLES_FETCH_TIMEOUT_MS = 45000;

function getApiUrl() {
  return process.env.CYBERPHOTOBOOTH_API_URL || DEFAULT_API_URL;
}

function normalizeStyle(style) {
  return {
    id: String(style.style_id || style.id || style.name),
    name: style.name,
    displayNameRu: style.display_name_ru || style.displayNameRu || style.display_name_en || style.name,
    displayNameEn: style.display_name_en || style.displayNameEn || style.name,
    previewUrl: style.preview_url || style.preview_url_thumb || style.previewUrl || null,
    modes: style.modes || [],
    source: 'cyberphotobooth'
  };
}

router.get('/', async (req, res) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), STYLES_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${getApiUrl()}/public/styles`, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        code: 'CYBERPHOTOBOOTH_STYLES_ERROR',
        message: 'Не удалось получить список стилей',
        details: data
      });
    }

    const sourceStyles = Array.isArray(data)
      ? data
      : Array.isArray(data.styles)
        ? data.styles
        : [];

    const styles = sourceStyles.map(normalizeStyle);

    return res.status(200).json({
      styles
    });
  } catch (error) {
    clearTimeout(timeoutId);

    console.error('CyberPhotoBooth styles fetch error:', error);

    const isTimeout = error.name === 'AbortError';

    return res.status(504).json({
      code: isTimeout ? 'CYBERPHOTOBOOTH_STYLES_TIMEOUT' : 'CYBERPHOTOBOOTH_STYLES_FETCH_ERROR',
      message: isTimeout
        ? 'CyberPhotoBooth долго не отвечает. Попробуйте обновить каталог стилей позже.'
        : 'Не удалось подключиться к CyberPhotoBooth. Попробуйте обновить каталог стилей позже.'
    });
  }
});

module.exports = router;
