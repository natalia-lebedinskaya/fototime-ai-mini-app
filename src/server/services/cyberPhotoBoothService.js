const DEFAULT_API_URL = 'https://api.cyberphotobooth.ru/api';

const FT_LOCAL_STYLE_MAP = {
  '1001': { title: 'Атлантида', provider: 'SDXL', aliases: ['Atlantida', 'Atlantis'] },
  '1002': { title: 'Барби', provider: 'SDXL', aliases: ['Barbie'] },
  '1003': { title: 'Баблгам', provider: 'SDXL', aliases: ['Bubblegum', 'Bablgam'] },
  '1004': { title: 'Бизнес', provider: 'SDXL', aliases: ['Business'] },
  '1005': { title: 'Рождество', provider: 'SDXL', aliases: ['Christmas', 'Рождество'] },
  '1006': { title: 'Комикс', provider: 'SDXL', aliases: ['Comics', 'Comic'] },
  '1007': { title: 'Киберпанк', provider: 'SDXL', aliases: ['Cyberpunk'] },
  '1008': { title: 'Дубай', provider: 'SDXL', aliases: ['Dubai'] },
  '1009': { title: 'Лесная сказка', provider: 'SDXL', aliases: ['Forest Tale', 'Fairy Forest'] },
  '2001': { title: 'Поле боя', provider: 'FLUX.2', aliases: ['23FevrBattlefield', 'Battlefield', 'Поле боя'] },
  '2002': { title: 'Кибернетика', provider: 'FLUX.2', aliases: ['Cybernetics', 'Кибернетика'] },
  '2003': { title: 'Алхимик', provider: 'FLUX.2', aliases: ['Alchemist', 'Алхимик'] },
  '2004': { title: 'Пираты', provider: 'FLUX.2', aliases: ['Pirates', 'Пираты'] },
  '2005': { title: 'Кабаре', provider: 'FLUX.2', aliases: ['Cabaret', 'Кабаре'] },
  '3001': { title: 'White rabbits', provider: 'Nano Banana', aliases: ['White rabbits'] },
  '3002': { title: 'Diamonds', provider: 'Nano Banana', aliases: ['Diamonds'] },
  '3003': { title: 'Luxor', provider: 'Nano Banana', aliases: ['Luxor'] },
  '3004': { title: 'Biker NB', provider: 'Nano Banana', aliases: ['Biker NB', 'Biker'] },
  '3005': { title: 'Business 001', provider: 'Nano Banana', aliases: ['Business 001', 'Business'] },
  '3006': { title: 'Пустыня', provider: 'Nano Banana', aliases: ['desert', 'Desert', 'Пустыня'] }
};

let FT_CPB_STYLES_CACHE = { ts: 0, data: null };

function getCyberPhotoBoothConfig() {
  const apiUrl = process.env.CYBERPHOTOBOOTH_API_URL || DEFAULT_API_URL;
  const apiKey = process.env.CYBERPHOTOBOOTH_API_KEY;
  const pollIntervalMs = Number(process.env.CYBERPHOTOBOOTH_POLL_INTERVAL_MS || 3000);
  const maxAttempts = Number(process.env.CYBERPHOTOBOOTH_MAX_ATTEMPTS || 40);

  if (!apiKey) {
    throw new Error('CYBERPHOTOBOOTH_API_KEY is not configured');
  }

  return {
    apiUrl,
    apiKey,
    pollIntervalMs,
    maxAttempts
  };
}

function ftNorm(value) {
  return String(value || '').trim().toLowerCase().replace(/ё/g, 'е');
}

function mapParticipantToSex(participantId) {
  const sexMap = {
    male: 'man',
    female: 'woman',
    boy: 'boy',
    girl: 'girl',
    couple: 'man',
    family: 'man'
  };

  return sexMap[participantId] || 'woman';
}

function getBase64FromFile(file) {
  return file.buffer.toString('base64');
}

async function fetchPublicStyles() {
  const config = getCyberPhotoBoothConfig();
  const now = Date.now();

  if (FT_CPB_STYLES_CACHE.data && (now - FT_CPB_STYLES_CACHE.ts) < 5 * 60 * 1000) {
    return FT_CPB_STYLES_CACHE.data;
  }

  const response = await fetch(`${config.apiUrl}/public/styles`, {
    method: 'GET',
    headers: { Accept: 'application/json' }
  });

  const data = await response.json().catch(() => []);

  if (!response.ok) {
    throw new Error(`CyberPhotoBooth public/styles failed: HTTP ${response.status}`);
  }

  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.styles)
      ? data.styles
      : Array.isArray(data?.items)
        ? data.items
        : [];

  FT_CPB_STYLES_CACHE = { ts: now, data: list };
  return list;
}

function pickMode(style, providerHint, modeHint) {
  const modes = Array.isArray(style?.modes) ? style.modes : [];
  if (!modes.length) return '';

  const provider = ftNorm(providerHint);
  const modeNeedle = ftNorm(modeHint);

  if (modeNeedle) {
    const exact = modes.find((m) =>
      ftNorm(m?.name) === modeNeedle || ftNorm(m?.display_name) === modeNeedle
    );
    if (exact?.name) return exact.name;
  }

  if (provider.includes('banana')) {
    const found = modes.find((m) =>
      ftNorm(m?.name).includes('banana') || ftNorm(m?.display_name).includes('banana')
    );
    if (found?.name) return found.name;
  }

  if (provider.includes('flux')) {
    const found = modes.find((m) =>
      ftNorm(m?.name).includes('edit') ||
      ftNorm(m?.name).includes('flux') ||
      ftNorm(m?.display_name).includes('flux')
    );
    if (found?.name) return found.name;
  }

  if (provider.includes('sdxl')) {
    const found = modes.find((m) =>
      ftNorm(m?.name).includes('sdxl') || ftNorm(m?.display_name).includes('sdxl')
    );
    if (found?.name) return found.name;
  }

  return modes[0]?.name || '';
}

function findPublicStyle(styles, styleInfo, explicitTitle) {
  const candidates = [];
  const explicit = String(explicitTitle || '').trim();
  if (explicit) candidates.push(explicit);
  if (styleInfo?.title) candidates.push(styleInfo.title);
  if (Array.isArray(styleInfo?.aliases)) candidates.push(...styleInfo.aliases);

  const normalizedCandidates = candidates.map(ftNorm).filter(Boolean);

  for (const needle of normalizedCandidates) {
    const found =
      styles.find((s) => ftNorm(s?.display_name_ru) === needle) ||
      styles.find((s) => ftNorm(s?.display_name_en) === needle) ||
      styles.find((s) => ftNorm(s?.name) === needle) ||
      styles.find((s) => {
        const values = [s?.display_name_ru, s?.display_name_en, s?.name]
          .map(ftNorm)
          .filter(Boolean);
        return values.some((v) => v.includes(needle) || needle.includes(v));
      });
    if (found) return found;
  }

  return null;
}

async function resolveCyberPhotoBoothStyle({ styleId, styleTitle, styleProvider, styleMode }) {
  const local = FT_LOCAL_STYLE_MAP[String(styleId || '').trim()] || null;
  const provider = String(styleProvider || local?.provider || '').trim();

  const styles = await fetchPublicStyles();
  const matched = findPublicStyle(styles, local, styleTitle);

  if (!matched || !matched.style_id) {
    throw new Error(`CyberPhotoBooth style not found for local style: ${styleId || styleTitle || 'unknown'}`);
  }

  const mode = pickMode(matched, provider, styleMode);
  if (!mode) {
    throw new Error(`CyberPhotoBooth mode not found for style: ${styleTitle || local?.title || matched?.name || 'unknown'}`);
  }

  const resolved = {
    localStyleId: String(styleId || ''),
    localTitle: String(styleTitle || local?.title || ''),
    provider,
    resolvedStyleId: String(matched.style_id),
    resolvedStyleName: matched.name || '',
    resolvedDisplayNameRu: matched.display_name_ru || matched.name || '',
    resolvedMode: String(mode),
    previewUrl:
      matched.preview_url_female ||
      matched.preview_url_male ||
      matched.preview_url ||
      ''
  };

  console.log('[FOTOTIME CPB RESOLVED STYLE]', resolved);
  return resolved;
}

async function submitGenerationJob({ file, participantId, styleId, styleTitle, styleProvider, styleMode }) {
  const config = getCyberPhotoBoothConfig();

  const resolved = await resolveCyberPhotoBoothStyle({
    styleId,
    styleTitle,
    styleProvider,
    styleMode
  });

  const body = {
    mode: String(resolved.resolvedMode),
    style: String(resolved.resolvedStyleId),
    return_s3_link: false,
    params: {
      Sex: mapParticipantToSex(participantId),
      Face: getBase64FromFile(file),
      Fon: getBase64FromFile(file)
    }
  };

  console.log('[FOTOTIME CPB FINAL BODY]', { style: body.style, mode: body.mode, return_s3_link: body.return_s3_link, sex: body?.params?.Sex, hasFace: Boolean(body?.params?.Face), hasFon: Boolean(body?.params?.Fon) });

  if (process.env.CYBERPHOTOBOOTH_DRY_RUN === 'true') {
    return {
      dryRun: true,
      requestBody: {
        ...body,
        params: {
          ...body.params,
          Face: '[base64 omitted]',
          Fon: '[base64 omitted]'
        }
      }
    };
  }

  const response = await fetch(`${config.apiUrl}/async/submit`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('CyberPhotoBooth submit error:', JSON.stringify({
      status: response.status,
      body: data
    }, null, 2));

    throw new Error(data.message || data.detail || data.error || 'CyberPhotoBooth generation request failed');
  }

  if (!data.job_id) {
    throw new Error('CyberPhotoBooth response does not contain job_id');
  }

  return {
    jobId: data.job_id,
    resolved
  };
}

async function getGenerationStatus(jobId) {
  const config = getCyberPhotoBoothConfig();

  const response = await fetch(`${config.apiUrl}/async/status/${jobId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${config.apiKey}`
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.detail || 'CyberPhotoBooth status request failed');
  }

  return data;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForGenerationResult(jobId) {
  const config = getCyberPhotoBoothConfig();

  for (let attempt = 1; attempt <= config.maxAttempts; attempt += 1) {
    const statusResponse = await getGenerationStatus(jobId);

    console.log('[FOTOTIME CPB STATUS]', {
      attempt,
      jobId,
      status: statusResponse.status
    });

    if (statusResponse.status === 'completed' || statusResponse.status === 'ready' || statusResponse.status === 'done') {
      const image =
        statusResponse?.results?.images?.[0] ||
        statusResponse?.result?.images?.[0] ||
        statusResponse?.image ||
        statusResponse?.image_url ||
        '';

      if (!image) {
        throw new Error('CyberPhotoBooth completed without image result');
      }

      const resultUrl = String(image).startsWith('http')
        ? String(image)
        : `data:image/png;base64,${image}`;

      return {
        resultUrl,
        jobId,
        status: statusResponse.status,
        processingTimeMs: statusResponse.processing_time_ms || null
      };
    }

    if (statusResponse.status === 'failed' || statusResponse.status === 'not_found' || statusResponse.status === 'error') {
      throw new Error(`CyberPhotoBooth generation failed with status: ${statusResponse.status}`);
    }

    await wait(config.pollIntervalMs);
  }

  throw new Error('CyberPhotoBooth generation timeout');
}

async function generateCyberPhotoBoothImage({ file, participantId, styleId, styleTitle, styleProvider, styleMode, originalFileName }) {
  const submitResult = await submitGenerationJob({
    file,
    participantId,
    styleId,
    styleTitle,
    styleProvider,
    styleMode
  });

  if (submitResult?.dryRun) {
    return {
      status: 'success',
      message: 'Dry-run: запрос в CyberPhotoBooth не отправлялся',
      resultUrl: '',
      provider: 'AI',
      request: {
        participantId,
        styleId,
        styleTitle,
        styleProvider,
        styleMode,
        originalFileName,
        jobId: null,
        requestBody: submitResult.requestBody
      }
    };
  }

  const result = await waitForGenerationResult(submitResult.jobId);

  return {
    status: 'success',
    message: 'Изображение успешно сгенерировано',
    resultUrl: result.resultUrl,
    provider: 'AI',
    request: {
      participantId,
      styleId,
      styleTitle,
      styleProvider,
      styleMode,
      originalFileName,
      jobId: submitResult.jobId,
      resolvedStyle: submitResult.resolved || null
    }
  };
}

module.exports = {
  generateCyberPhotoBoothImage,
  fetchPublicStyles
};
