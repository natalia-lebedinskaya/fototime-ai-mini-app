const express = require('express');
const eventConfig = require('../data/eventConfig');

const router = express.Router();

const DEFAULT_API_URL = 'https://api.cyberphotobooth.ru/api';
const STYLES_FETCH_TIMEOUT_MS = 25000;

function getApiUrl() {
  return process.env.CYBERPHOTOBOOTH_API_URL || DEFAULT_API_URL;
}

function getModeName(mode) {
  return mode?.display_name || mode?.displayName || mode?.name || 'AI';
}

function normalizeStyle(style) {
  const modes = Array.isArray(style.modes) ? style.modes : [];

  return {
    id: String(style.style_id || style.id || style.name),
    name: style.name || style.display_name_en || style.displayNameEn || String(style.style_id || style.id),
    displayNameRu: style.display_name_ru || style.displayNameRu || style.display_name_en || style.name,
    displayNameEn: style.display_name_en || style.displayNameEn || style.name,
    previewUrl: style.preview_url || style.previewUrl || style.preview_url_thumb || null,
    modes,
    modeNames: modes.map(getModeName),
    participantType: 'male',
    isAvailable: true,
    source: 'cyberphotobooth'
  };
}

function normalizeFallbackStyle(style) {
  const modeName = style.modeName || style.provider || 'AI';

  return {
    id: String(style.id),
    name: style.name,
    displayNameRu: style.name,
    displayNameEn: style.name,
    previewUrl: style.previewUrl || null,
    modes: [
      {
        name: modeName,
        display_name: modeName
      }
    ],
    modeNames: [modeName],
    participantType: style.participantType || 'male',
    isAvailable: style.isAvailable !== false,
    source: 'event-config-fallback'
  };
}

function getFallbackStyles() {
  return (eventConfig.styles || [])
    .filter((style) => style.isAvailable !== false)
    .map(normalizeFallbackStyle);
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
      return res.status(200).json({
        styles: getFallbackStyles(),
        source: 'event-config-fallback',
        warning: 'CyberPhotoBooth styles are temporarily unavailable'
      });
    }

    const rawStyles = Array.isArray(data)
      ? data
      : Array.isArray(data.styles)
        ? data.styles
        : [];

    const styles = rawStyles.map(normalizeStyle);

    return res.status(200).json({
      styles,
      source: 'cyberphotobooth'
    });
  } catch (error) {
    clearTimeout(timeoutId);

    console.error('CyberPhotoBooth styles fetch error:', error);

    return res.status(200).json({
      styles: getFallbackStyles(),
      source: 'event-config-fallback',
      warning: 'CyberPhotoBooth styles are temporarily unavailable'
    });
  }
});

module.exports = router;
