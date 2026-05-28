const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const STORAGE_ROOT = path.join(process.cwd(), 'storage');
const UPLOADS_DIR = path.join(STORAGE_ROOT, 'uploads');
const RESULTS_DIR = path.join(STORAGE_ROOT, 'results');
const METADATA_DIR = path.join(STORAGE_ROOT, 'metadata');

async function ensureStorageDirs() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.mkdir(RESULTS_DIR, { recursive: true });
  await fs.mkdir(METADATA_DIR, { recursive: true });
}

function getSafeExtension(fileName, fallback = '.jpg') {
  const ext = path.extname(fileName || '').toLowerCase();

  if (['.jpg', '.jpeg', '.png'].includes(ext)) {
    return ext;
  }

  return fallback;
}

function createGenerationId() {
  const date = new Date().toISOString().slice(0, 10);
  const random = crypto.randomBytes(4).toString('hex');

  return `${date}_${random}`;
}

async function saveOriginalPhoto(file, generationId) {
  await ensureStorageDirs();

  const ext = getSafeExtension(file.originalname);
  const fileName = `${generationId}_original${ext}`;
  const filePath = path.join(UPLOADS_DIR, fileName);

  await fs.writeFile(filePath, file.buffer);

  return {
    fileName,
    filePath,
    relativePath: path.relative(process.cwd(), filePath)
  };
}

async function saveResultImage(resultUrl, generationId) {
  await ensureStorageDirs();

  if (!resultUrl) {
    return null;
  }

  if (resultUrl.startsWith('data:image')) {
    const match = resultUrl.match(/^data:image\/(\w+);base64,(.+)$/);

    if (!match) {
      return null;
    }

    const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
    const base64Data = match[2];
    const fileName = `${generationId}_result.${extension}`;
    const filePath = path.join(RESULTS_DIR, fileName);

    await fs.writeFile(filePath, Buffer.from(base64Data, 'base64'));

    return {
      fileName,
      filePath,
      relativePath: path.relative(process.cwd(), filePath)
    };
  }

  return {
    fileName: null,
    filePath: resultUrl,
    relativePath: resultUrl
  };
}

async function saveGenerationMetadata(metadata, generationId) {
  await ensureStorageDirs();

  const fileName = `${generationId}.json`;
  const filePath = path.join(METADATA_DIR, fileName);

  await fs.writeFile(filePath, JSON.stringify(metadata, null, 2), 'utf8');

  return {
    fileName,
    filePath,
    relativePath: path.relative(process.cwd(), filePath)
  };
}

module.exports = {
  createGenerationId,
  saveOriginalPhoto,
  saveResultImage,
  saveGenerationMetadata
};
