'use strict';

const DEFAULT_POLL_INTERVAL_MS = 3_000;
const DEFAULT_MAX_ATTEMPTS = 40;
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
const STYLE_CACHE_TTL_MS = 5 * 60 * 1_000;

const LOCAL_STYLE_ALIASES = {
  1001: { title: 'Атлантида', model: 'SDXL', aliases: ['Atlantida', 'Atlantis'] },
  1002: { title: 'Барби', model: 'SDXL', aliases: ['Barbie'] },
  1003: { title: 'Баблгам', model: 'SDXL', aliases: ['Bubblegum', 'Bablgam'] },
  1004: { title: 'Бизнес', model: 'SDXL', aliases: ['Business'] },
  1005: { title: 'Рождество', model: 'SDXL', aliases: ['Christmas'] },
  1006: { title: 'Комикс', model: 'SDXL', aliases: ['Comics', 'Comic'] },
  1007: { title: 'Киберпанк', model: 'SDXL', aliases: ['Cyberpunk'] },
  1008: { title: 'Дубай', model: 'SDXL', aliases: ['Dubai'] },
  1009: { title: 'Лесная сказка', model: 'SDXL', aliases: ['Forest Tale', 'Fairy Forest'] },
  2001: { title: 'Поле боя', model: 'FLUX.2', aliases: ['Battlefield'] },
  2002: { title: 'Кибернетика', model: 'FLUX.2', aliases: ['Cybernetics'] },
  2003: { title: 'Алхимик', model: 'FLUX.2', aliases: ['Alchemist'] },
  2004: { title: 'Пираты', model: 'FLUX.2', aliases: ['Pirates'] },
  2005: { title: 'Кабаре', model: 'FLUX.2', aliases: ['Cabaret'] },
  3001: { title: 'White rabbits', model: 'Nano Banana', aliases: [] },
  3002: { title: 'Diamonds', model: 'Nano Banana', aliases: [] },
  3003: { title: 'Luxor', model: 'Nano Banana', aliases: [] },
  3004: { title: 'Biker NB', model: 'Nano Banana', aliases: ['Biker'] },
  3005: { title: 'Business 001', model: 'Nano Banana', aliases: ['Business'] },
  3006: { title: 'Пустыня', model: 'Nano Banana', aliases: ['Desert'] },
};

let styleCache = { expiresAt: 0, items: null };

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeBaseUrl(value) {
  return String(value || '')
    .trim()
    .replace(/\/+$/, '');
}

function getConfig({ requireApiKey = false } = {}) {
  const baseUrl = normalizeBaseUrl(process.env.IMAGE_PROVIDER_BASE_URL);
  const apiKey = String(process.env.IMAGE_PROVIDER_API_KEY || '').trim();

  if (!baseUrl) {
    const error = new Error('Image provider base URL is not configured');
    error.code = 'IMAGE_PROVIDER_NOT_CONFIGURED';
    throw error;
  }

  if (requireApiKey && !apiKey) {
    const error = new Error('Image provider API key is not configured');
    error.code = 'IMAGE_PROVIDER_NOT_CONFIGURED';
    throw error;
  }

  return {
    baseUrl,
    apiKey,
    pollIntervalMs: positiveInteger(process.env.IMAGE_PROVIDER_POLL_INTERVAL_MS, DEFAULT_POLL_INTERVAL_MS),
    maxAttempts: positiveInteger(process.env.IMAGE_PROVIDER_MAX_ATTEMPTS, DEFAULT_MAX_ATTEMPTS),
    requestTimeoutMs: positiveInteger(
      process.env.IMAGE_PROVIDER_REQUEST_TIMEOUT_MS,
      DEFAULT_REQUEST_TIMEOUT_MS,
    ),
    dryRun: String(process.env.IMAGE_PROVIDER_DRY_RUN || '').toLowerCase() === 'true',
  };
}

async function requestJson(url, options = {}, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(
        payload?.message ||
          payload?.detail ||
          payload?.error ||
          `Provider request failed: HTTP ${response.status}`,
      );
      error.code = 'IMAGE_PROVIDER_REQUEST_FAILED';
      error.status = response.status;
      throw error;
    }

    return payload;
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Image provider request timed out');
      timeoutError.code = 'IMAGE_PROVIDER_TIMEOUT';
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е');
}

function extractStyleList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.styles)) return payload.styles;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.styles)) return payload.data.styles;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

async function fetchPublicStyles({ forceRefresh = false } = {}) {
  const config = getConfig();
  const currentTime = Date.now();

  if (!forceRefresh && styleCache.items && styleCache.expiresAt > currentTime) {
    return styleCache.items;
  }

  const payload = await requestJson(
    `${config.baseUrl}/public/styles`,
    { method: 'GET', headers: { Accept: 'application/json' } },
    config.requestTimeoutMs,
  );
  const items = extractStyleList(payload);
  styleCache = { items, expiresAt: currentTime + STYLE_CACHE_TTL_MS };
  return items;
}

function selectMode(style, modelHint, explicitMode) {
  const modes = Array.isArray(style?.modes) ? style.modes : [];
  if (!modes.length) return '';

  const requestedMode = normalize(explicitMode);
  if (requestedMode) {
    const exact = modes.find((mode) =>
      [mode?.name, mode?.display_name, mode?.displayName].some((value) => normalize(value) === requestedMode),
    );
    if (exact?.name) return exact.name;
  }

  const model = normalize(modelHint);
  const modelTokens = model.includes('banana')
    ? ['banana']
    : model.includes('flux')
      ? ['flux', 'edit']
      : model.includes('sdxl')
        ? ['sdxl']
        : [];

  const inferred = modes.find((mode) => {
    const text = normalize(`${mode?.name || ''} ${mode?.display_name || ''} ${mode?.displayName || ''}`);
    return modelTokens.some((token) => text.includes(token));
  });

  return inferred?.name || modes[0]?.name || '';
}

function findStyle(styles, { styleId, styleTitle }) {
  const local = LOCAL_STYLE_ALIASES[String(styleId || '').trim()] || null;
  const candidates = [styleTitle, local?.title, ...(local?.aliases || [])].map(normalize).filter(Boolean);
  const id = String(styleId || '').trim();

  return (
    styles.find((style) => id && String(style?.style_id || style?.id || '') === id) ||
    styles.find((style) => {
      const names = [style?.display_name_ru, style?.display_name_en, style?.name, style?.title]
        .map(normalize)
        .filter(Boolean);
      return candidates.some((candidate) =>
        names.some((name) => name === candidate || name.includes(candidate) || candidate.includes(name)),
      );
    }) ||
    null
  );
}

function mapParticipant(participantId) {
  return (
    {
      male: 'man',
      female: 'woman',
      boy: 'boy',
      girl: 'girl',
      couple: 'man',
      family: 'man',
    }[participantId] || 'woman'
  );
}

async function resolveStyle(input) {
  const styles = await fetchPublicStyles();
  const matched = findStyle(styles, input);

  if (!matched) {
    const error = new Error(
      `Selected style is unavailable: ${input.styleId || input.styleTitle || 'unknown'}`,
    );
    error.code = 'IMAGE_STYLE_NOT_FOUND';
    throw error;
  }

  const local = LOCAL_STYLE_ALIASES[String(input.styleId || '').trim()] || null;
  const mode = selectMode(matched, input.styleModel || local?.model, input.styleMode);
  const resolvedStyleId = String(matched.style_id || matched.id || '').trim();

  if (!resolvedStyleId || !mode) {
    const error = new Error('Selected style does not contain a valid generation mode');
    error.code = 'IMAGE_STYLE_INVALID';
    throw error;
  }

  return {
    id: resolvedStyleId,
    mode,
    name: matched.name || matched.display_name_en || matched.display_name_ru || input.styleTitle || '',
  };
}

async function submitJob(input) {
  const config = getConfig({ requireApiKey: true });
  const style = await resolveStyle(input);
  const image = input.file.buffer.toString('base64');
  const body = {
    mode: style.mode,
    style: style.id,
    return_s3_link: false,
    params: {
      Sex: mapParticipant(input.participantId),
      Face: image,
      Fon: image,
    },
  };

  if (config.dryRun) return { dryRun: true, style };

  const payload = await requestJson(
    `${config.baseUrl}/async/submit`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
    config.requestTimeoutMs,
  );

  if (!payload.job_id) {
    const error = new Error('Image provider did not return a job identifier');
    error.code = 'IMAGE_PROVIDER_INVALID_RESPONSE';
    throw error;
  }

  return { jobId: payload.job_id, style };
}

async function pollJob(jobId) {
  const config = getConfig({ requireApiKey: true });

  for (let attempt = 1; attempt <= config.maxAttempts; attempt += 1) {
    const payload = await requestJson(
      `${config.baseUrl}/async/status/${encodeURIComponent(jobId)}`,
      { method: 'GET', headers: { Authorization: `Bearer ${config.apiKey}` } },
      config.requestTimeoutMs,
    );
    const status = normalize(payload.status);

    if (['completed', 'ready', 'done'].includes(status)) {
      const image =
        payload?.results?.images?.[0] ||
        payload?.result?.images?.[0] ||
        payload?.image ||
        payload?.image_url ||
        '';

      if (!image) {
        const error = new Error('Image provider completed the job without an image');
        error.code = 'IMAGE_PROVIDER_INVALID_RESPONSE';
        throw error;
      }

      return {
        resultUrl: String(image).startsWith('http') ? String(image) : `data:image/png;base64,${image}`,
        processingTimeMs: payload.processing_time_ms || null,
      };
    }

    if (['failed', 'not_found', 'error'].includes(status)) {
      const error = new Error(`Image generation failed with status: ${status}`);
      error.code = 'IMAGE_PROVIDER_JOB_FAILED';
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, config.pollIntervalMs));
  }

  const error = new Error('Image generation timed out');
  error.code = 'IMAGE_PROVIDER_TIMEOUT';
  throw error;
}

async function generateImage(input) {
  const submitted = await submitJob(input);
  if (submitted.dryRun) {
    return { status: 'dry-run', resultUrl: '', jobId: null, resolvedStyle: submitted.style };
  }

  const completed = await pollJob(submitted.jobId);
  return {
    status: 'success',
    resultUrl: completed.resultUrl,
    jobId: submitted.jobId,
    resolvedStyle: submitted.style,
    processingTimeMs: completed.processingTimeMs,
  };
}

module.exports = {
  extractStyleList,
  fetchPublicStyles,
  generateImage,
  getConfig,
};
