const express = require('express');
const fs = require('fs');
const path = require('path');
const {
  DEFAULT_GENERATION_COST,
  getIdentityFromRequest,
  getOrCreateUser,
  getTransactionsByUser
} = require('../services/userStoreService');

const router = express.Router();

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

router.get('/me', (req, res) => {
  const identity = getIdentityFromRequest(req);
  const user = getOrCreateUser(identity);

  res.json({
    user,
    generationCost: DEFAULT_GENERATION_COST,
    transactions: getTransactionsByUser(user.id).slice(0, 20)
  });
});

router.get('/history', (req, res) => {
  const identity = getIdentityFromRequest(req);
  const user = getOrCreateUser(identity);

  const metadataDir = path.join(process.cwd(), 'storage', 'metadata');

  if (!fs.existsSync(metadataDir)) {
    return res.json({ items: [] });
  }

  const items = fs
    .readdirSync(metadataDir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .reverse()
    .map((file) => {
      const meta = readJsonSafe(path.join(metadataDir, file));

      if (!meta) return null;
      if (String(meta.userId || '') !== String(user.id)) return null;

      const baseName = file.replace('.json', '');
      const resultFile = `${baseName}_result.png`;
      const resultPath = path.join(process.cwd(), 'storage', 'results', resultFile);

      return {
        id: meta.generationId || baseName,
        generationId: meta.generationId || baseName,
        styleId: meta.styleId || null,
        styleTitle: meta.styleTitle || meta.styleName || meta.styleId || 'AI style',
        styleProvider: meta.styleProvider || null,
        provider: meta.provider || null,
        createdAt: meta.createdAt || new Date().toISOString(),
        costCredits: meta.costCredits || DEFAULT_GENERATION_COST,
        resultUrl: fs.existsSync(resultPath)
          ? `/storage/results/${resultFile}`
          : meta.resultUrl || null
      };
    })
    .filter(Boolean)
    .slice(0, 100);

  res.json({ items });
});

module.exports = router;
