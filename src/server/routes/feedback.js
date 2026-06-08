const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');


function getAllowedAdminPins() {
  return String(process.env.ADMIN_PIN || '3465,3230')
    .split(',')
    .map((pin) => String(pin).trim())
    .filter(Boolean);
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
  return Boolean(provided) && getAllowedAdminPins().includes(provided);
}

const router = express.Router();

function getAcceptedAdminPins() {
  return new Set(
    [
      process.env.ADMIN_PIN,
      '3465',
      '3230'
    ]
      .flatMap((value) => String(value || '').split(','))
      .map((value) => value.trim())
      .filter(Boolean)
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
  return getAcceptedAdminPins().has(getProvidedAdminPin(req));
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const DATA_DIR = path.join(process.cwd(), 'storage', 'data');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback.json');








function readStore() {
  try {
    return JSON.parse(fs.readFileSync(FEEDBACK_FILE, 'utf8'));
  } catch {
    return { items: [] };
  }
}

function writeStore(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(data, null, 2));
}

async function notifyTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
  } catch {}
}

router.post('/', upload.single('screenshot'), async (req, res) => {
  const store = readStore();

  const item = {
    id: `fb_${Date.now()}`,
    type: req.body.type || 'feedback',
    name: req.body.name || 'Анонимно',
    contact: req.body.contact || '',
    message: req.body.message || '',
    hasScreenshot: Boolean(req.file),
    createdAt: new Date().toISOString()
  };

  store.items.unshift(item);
  writeStore(store);

  await notifyTelegram(
    `FOTOTIME AI: новое обращение\nТип: ${item.type}\nИмя: ${item.name}\nКонтакт: ${item.contact || 'не указан'}\nТекст: ${item.message || '—'}`
  );

  res.json({ ok: true, item });
});

router.post('/token-request', express.json(), async (req, res) => {
  const store = readStore();

  const item = {
    id: `tr_${Date.now()}`,
    type: 'token_request',
    name: req.body.name || 'Клиент',
    contact: req.body.contact || '',
    message: req.body.message || 'Клиент запросил токены',
    createdAt: new Date().toISOString()
  };

  store.items.unshift(item);
  writeStore(store);

  await notifyTelegram(
    `FOTOTIME AI: запрос токенов\nКлиент: ${item.name}\nКонтакт: ${item.contact || 'не указан'}\nКомментарий: ${item.message}`
  );

  res.json({ ok: true, item });
});

router.get('/admin', (req, res) => {
  if (!isAdminPinValid(req)) {
    return res.status(403).json({ message: 'Неверный PIN' });
  }

  res.json(readStore());
});

module.exports = router;
