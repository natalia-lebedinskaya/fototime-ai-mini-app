const fs = require('fs/promises');
const path = require('path');

const WEBDAV_BASE_URL = 'https://webdav.yandex.ru';

function isEnabled() {
  return process.env.YANDEX_DISK_ENABLED === 'true';
}

function getAuthHeader() {
  const username = process.env.YANDEX_DISK_USERNAME;
  const password = process.env.YANDEX_DISK_PASSWORD;

  if (!username || !password) {
    return null;
  }

  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

function normalizeRemotePath(value) {
  return String(value || '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
}

async function ensureRemoteDir(remotePath) {
  const auth = getAuthHeader();

  if (!isEnabled() || !auth) return;

  const parts = normalizeRemotePath(remotePath).split('/').filter(Boolean);
  let current = '';

  for (const part of parts) {
    current = current ? `${current}/${part}` : part;

    await fetch(`${WEBDAV_BASE_URL}/${encodeURI(current)}`, {
      method: 'MKCOL',
      headers: {
        Authorization: auth
      }
    }).catch(() => null);
  }
}

async function uploadFile(localFilePath, remoteFilePath) {
  const auth = getAuthHeader();

  if (!isEnabled() || !auth) {
    return {
      skipped: true,
      reason: 'Yandex Disk backup disabled or credentials missing'
    };
  }

  const buffer = await fs.readFile(localFilePath);
  const remoteDir = path.posix.dirname(normalizeRemotePath(remoteFilePath));

  await ensureRemoteDir(remoteDir);

  const response = await fetch(`${WEBDAV_BASE_URL}/${encodeURI(normalizeRemotePath(remoteFilePath))}`, {
    method: 'PUT',
    headers: {
      Authorization: auth
    },
    body: buffer
  });

  if (!response.ok) {
    throw new Error(`Yandex Disk upload failed: ${response.status}`);
  }

  return {
    uploaded: true,
    remotePath: `/${normalizeRemotePath(remoteFilePath)}`
  };
}

async function backupGenerationFiles({ generationId, originalPhotoPath, resultImagePath, metadataPath }) {
  if (!isEnabled()) {
    return {
      skipped: true,
      reason: 'Yandex Disk backup disabled'
    };
  }

  const basePath = normalizeRemotePath(
    process.env.YANDEX_DISK_BASE_PATH || 'Приложения/Neural Solutions/fototime323Bot'
  );

  const date = new Date().toISOString().slice(0, 10);
  const generationDir = `${basePath}/${date}/${generationId}`;

  const uploaded = [];

  if (originalPhotoPath) {
    uploaded.push(await uploadFile(
      path.join(process.cwd(), originalPhotoPath),
      `${generationDir}/original_${path.basename(originalPhotoPath)}`
    ));
  }

  if (resultImagePath) {
    uploaded.push(await uploadFile(
      path.join(process.cwd(), resultImagePath),
      `${generationDir}/result_${path.basename(resultImagePath)}`
    ));
  }

  if (metadataPath) {
    uploaded.push(await uploadFile(
      path.join(process.cwd(), metadataPath),
      `${generationDir}/metadata.json`
    ));
  }

  return {
    uploaded: true,
    generationDir: `/${generationDir}`,
    files: uploaded
  };
}

module.exports = {
  backupGenerationFiles
};
