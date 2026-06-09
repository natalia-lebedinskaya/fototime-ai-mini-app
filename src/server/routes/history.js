const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

router.get('/', (req, res) => {
  const metadataDir = path.join(process.cwd(), 'storage', 'metadata');

  if (!fs.existsSync(metadataDir)) {
    return res.json({ items: [] });
  }

  const files = fs
    .readdirSync(metadataDir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .reverse()
    .slice(0, 100);

  const items = files
    .map((file) => {
      const meta = readJsonSafe(path.join(metadataDir, file));

      if (!meta) return null;

      const baseName = file.replace('.json', '');
      const resultFile = `${baseName}_result.png`;
      const resultPath = path.join(process.cwd(), 'storage', 'results', resultFile);

      return {
        id: meta.generationId || baseName,
        generationId: meta.generationId || baseName,
        participantId: meta.participantId || null,
        styleId: meta.styleId || meta.requestedStyleId || null,
        styleTitle: meta.styleTitle || meta.requestedStyleTitle || meta.styleId || 'AI style',
        provider: meta.provider || null,
        createdAt: meta.createdAt || baseName.slice(0, 10),
        resultUrl: fs.existsSync(resultPath)
          ? `/storage/results/${resultFile}`
          : meta.resultUrl || meta.imageUrl || null,
        originalUrl: meta.originalPhoto
          ? `/storage/uploads/${path.basename(meta.originalPhoto)}`
          : null
      };
    })
    .filter(Boolean)
    .filter((item) => item.resultUrl);

  res.json({ items });
});

module.exports = router;
