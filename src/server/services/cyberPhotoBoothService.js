const DEFAULT_API_URL = 'https://api.cyberphotobooth.ru/api';

function getCyberPhotoBoothConfig() {
  const apiUrl = process.env.CYBERPHOTOBOOTH_API_URL || DEFAULT_API_URL;
  const apiKey = process.env.CYBERPHOTOBOOTH_API_KEY;
  const style = process.env.CYBERPHOTOBOOTH_STYLE || '1029';
  const mode = process.env.CYBERPHOTOBOOTH_MODE || 'style_sdxl_zero';
  const pollIntervalMs = Number(process.env.CYBERPHOTOBOOTH_POLL_INTERVAL_MS || 3000);
  const maxAttempts = Number(process.env.CYBERPHOTOBOOTH_MAX_ATTEMPTS || 20);

  if (!apiKey) {
    throw new Error('CYBERPHOTOBOOTH_API_KEY is not configured');
  }

  return {
    apiUrl,
    apiKey,
    style,
    mode,
    pollIntervalMs,
    maxAttempts
  };
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

  return sexMap[participantId] || 'man';
}

function getBase64FromFile(file) {
  return file.buffer.toString('base64');
}

async function submitGenerationJob({ file, participantId, cyberPhotoBoothStyle }) {
  const config = getCyberPhotoBoothConfig();

  const styleConfig = cyberPhotoBoothStyle || {
    type: 'style',
    value: String(config.style)
  };

  const body = {
    mode: config.mode,
    return_s3_link: false,
    params: {
      Sex: mapParticipantToSex(participantId),
      Face: getBase64FromFile(file),
      Fon: getBase64FromFile(file)
    }
  };

  if (styleConfig.type === 'user_style_id') {
    body.user_style_id = String(styleConfig.value);
  } else {
    body.style = String(styleConfig.value);
  }

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

  const data = await response.json();

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

  return data.job_id;
}

async function getGenerationStatus(jobId) {
  const config = getCyberPhotoBoothConfig();

  const response = await fetch(`${config.apiUrl}/async/status/${jobId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${config.apiKey}`
    }
  });

  const data = await response.json();

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

    if (statusResponse.status === 'completed') {
      const image = statusResponse.results?.images?.[0];

      if (!image) {
        throw new Error('CyberPhotoBooth completed without image result');
      }

      const resultUrl = image.startsWith('http')
        ? image
        : `data:image/png;base64,${image}`;

      return {
        resultUrl,
        jobId,
        status: statusResponse.status,
        processingTimeMs: statusResponse.processing_time_ms
      };
    }

    if (statusResponse.status === 'failed' || statusResponse.status === 'not_found') {
      throw new Error(`CyberPhotoBooth generation failed with status: ${statusResponse.status}`);
    }

    await wait(config.pollIntervalMs);
  }

  throw new Error('CyberPhotoBooth generation timeout');
}

async function generateCyberPhotoBoothImage({ file, participantId, styleId, cyberPhotoBoothStyle, originalFileName }) {
  const job = await submitGenerationJob({
    file,
    participantId,
    styleId,
    cyberPhotoBoothStyle
  });

  if (job?.dryRun) {
    return {
      status: 'success',
      message: 'Dry-run: запрос в CyberPhotoBooth не отправлялся',
      resultUrl: '/assets/mock-result.svg',
      provider: 'cyberphotobooth-dry-run',
      request: {
        participantId,
        styleId,
        originalFileName,
        jobId: null,
        cyberPhotoBoothStyle,
        requestBody: job.requestBody
      }
    };
  }

  const result = await waitForGenerationResult(job);

  return {
    status: 'success',
    message: 'Изображение успешно сгенерировано',
    resultUrl: result.resultUrl,
    provider: 'cyberphotobooth',
    request: {
      participantId,
      styleId,
      originalFileName,
      jobId: job,
      cyberPhotoBoothStyle
    }
  };
}

module.exports = {
  generateCyberPhotoBoothImage
};
