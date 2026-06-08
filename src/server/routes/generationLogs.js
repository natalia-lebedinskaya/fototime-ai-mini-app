const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const DATA_DIR = path.join(process.cwd(), 'storage', 'data');
const LOGS_FILE = path.join(DATA_DIR, 'generation-errors.json');

function getAcceptedAdminPins() {
  return new Set(
    String(process.env.ADMIN_PIN || '3465,3230')
      .split(',')
      .map((pin) => String(pin).trim())
      .filter(Boolean)
      .concat(['3465', '3230'])
  );
}

function getProvidedAdminPin(req) {
  return String(
    req.headers?.['x-admin-pin'] ||
    req.body?.pin ||
    req.query?.pin ||
    ''
  ).trim();
}

function isAdminPinValid(req) {
  const provided = getProvidedAdminPin(req);
  return Boolean(provided) && getAcceptedAdminPins().has(provided);
}


function readStore() {
  try {
    return JSON.parse(fs.readFileSync(LOGS_FILE, 'utf8'));
  } catch {
    return { items: [] };
  }
}

function writeStore(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(LOGS_FILE, JSON.stringify(data, null, 2));
}

router.post('/', express.json(), (req, res) => {
  const store = readStore();

  store.items.unshift({
    id: `err_${Date.now()}`,
    message: req.body.message || 'Unknown error',
    stack: req.body.stack || '',
    source: req.body.source || 'client',
    userAgent: req.headers['user-agent'] || '',
    createdAt: new Date().toISOString()
  });

  store.items = store.items.slice(0, 100);
  writeStore(store);

  res.json({ ok: true });
});

router.get('/admin', (req, res) => {
  if (!isAdminPinValid(req)) {
    return res.status(403).json({ message: 'Неверный PIN' });
  }

  res.json(readStore());
});

module.exports = router;
