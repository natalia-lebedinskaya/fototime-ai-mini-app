const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

router.use(express.json({ limit: '2mb' }));

function readItems() {
  const file = path.join(process.cwd(), 'data', 'critical-errors.json');

  if (!fs.existsSync(file)) return [];

  const parsed = JSON.parse(fs.readFileSync(file, 'utf-8'));
  return Array.isArray(parsed) ? parsed : Array.isArray(parsed.items) ? parsed.items : [];
}

function writeItems(items) {
  const dir = path.join(process.cwd(), 'data');
  fs.mkdirSync(dir, { recursive: true });

  const file = path.join(dir, 'critical-errors.json');
  fs.writeFileSync(file, JSON.stringify(items.slice(0, 300), null, 2), 'utf-8');
}

router.get('/', (req, res) => {
  try {
    const items = readItems();
    const limit = Math.max(1, Math.min(Number(req.query.limit || 30), 100));

    res.json({
      ok: true,
      count: items.length,
      items: items.slice(0, limit)
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      code: 'CRITICAL_ERRORS_READ_FAILED',
      message: error.message
    });
  }
});

router.post('/', (req, res) => {
  try {
    const body = req.body || {};

    const item = {
      id: `critical_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      severity: body.severity || 'critical',
      status: 'NEW',
      type: body.type || 'MANUAL_CRITICAL_REPORT',
      title: body.title || 'Проблема с результатом генерации',
      message: body.message || 'Пользователь сообщил о проблеме с результатом генерации',
      details: body.details || {},
      createdAt: new Date().toISOString()
    };

    const items = readItems();
    items.unshift(item);
    writeItems(items);

    console.error('[FOTOTIME CRITICAL]', item);

    res.json({
      ok: true,
      item
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      code: 'CRITICAL_ERRORS_WRITE_FAILED',
      message: error.message
    });
  }
});

module.exports = router;
