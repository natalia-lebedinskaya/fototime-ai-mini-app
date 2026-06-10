const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const dataDir = path.join(process.cwd(), 'data', 'ft-stable');
const uploadDir = path.join(dataDir, 'uploads');

fs.mkdirSync(uploadDir, { recursive: true });

const jsonParser = express.json({ limit: '2mb' });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const safeName = String(file.originalname || 'upload')
        .replace(/[^a-zA-Z0-9а-яА-ЯёЁ._-]+/g, '-')
        .slice(-90);

      cb(null, `${Date.now()}-${safeName}`);
    }
  }),
  limits: {
    fileSize: 12 * 1024 * 1024,
    files: 5
  }
});

function filePath(name) {
  return path.join(dataDir, name);
}

function readJson(name, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath(name), 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function writeJson(name, data) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2));
}

function push(name, item, limit = 300) {
  const list = readJson(name, []);
  list.unshift(item);
  writeJson(name, list.slice(0, limit));
  return item;
}

function now() {
  return new Date().toISOString();
}

function id(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function readState() {
  const state = readJson('state.json', {
    balance: 50,
    active: []
  });

  if (!Number.isFinite(Number(state.balance))) state.balance = 50;
  if (!Array.isArray(state.active)) state.active = [];

  return state;
}

function writeState(state) {
  writeJson('state.json', state);
}

function audit(title, level, details, user) {
  return push('audit.json', {
    id: id('audit'),
    title,
    level: level || 'info',
    details: details || {},
    user: user || null,
    createdAt: now()
  }, 500);
}

router.use('/uploads', express.static(uploadDir));

router.get('/state', (_req, res) => {
  res.json(readState());
});

router.post('/state/balance', jsonParser, (req, res) => {
  const state = readState();
  const next = Number(req.body && req.body.balance);

  if (Number.isFinite(next)) {
    state.balance = Math.max(0, next);
  }

  writeState(state);

  audit('Баланс обновлён клиентом', 'info', {
    balance: state.balance
  }, req.body && req.body.user);

  res.json({
    ok: true,
    balance: state.balance
  });
});

router.post('/audit', jsonParser, (req, res) => {
  const body = req.body || {};

  const item = audit(
    body.title || body.message || 'Событие клиента',
    body.level || 'info',
    body.details || {},
    body.user || null
  );

  res.json({
    ok: true,
    item
  });
});

router.post('/photo', upload.any(), (req, res) => {
  const file = req.files && req.files[0];

  if (!file) {
    return res.status(400).json({
      ok: false,
      message: 'Файл не передан'
    });
  }

  const item = {
    id: id('photo'),
    type: req.body.type || 'source',
    url: `/api/ft/uploads/${file.filename}`,
    fileName: file.originalname,
    title: req.body.title || req.body.styleTitle || 'Фото пользователя',
    styleTitle: req.body.styleTitle || '',
    styleProvider: req.body.styleProvider || '',
    userId: req.body.userId || '',
    userName: req.body.userName || 'Клиент',
    user: {
      id: req.body.userId || '',
      name: req.body.userName || 'Клиент'
    },
    createdAt: now()
  };

  push('photos.json', item, 200);
  audit('Фото пользователя загружено', 'info', item, item.user);

  res.json({
    ok: true,
    item
  });
});

router.post('/generation/status', jsonParser, (req, res) => {
  const body = req.body || {};
  const state = readState();
  const userId = body.user && body.user.id ? String(body.user.id) : 'local-demo-user';

  state.active = (state.active || []).filter((item) => item.userId !== userId);

  if (body.status === 'processing') {
    state.active.unshift({
      id: id('gen'),
      userId,
      user: body.user || null,
      title: body.title || 'Генерация в процессе',
      status: body.status,
      style: body.style || null,
      createdAt: now()
    });
  }

  writeState(state);

  audit(
    body.title || 'Статус генерации',
    body.status === 'error' ? 'error' : 'info',
    body,
    body.user || null
  );

  if (body.resultUrl) {
    push('photos.json', {
      id: id('photo'),
      type: 'result',
      url: body.resultUrl,
      title: body.style && body.style.title,
      style: body.style || null,
      user: body.user || null,
      createdAt: now()
    }, 200);
  }

  res.json({
    ok: true,
    active: state.active
  });
});

router.post('/feedback', upload.any(), (req, res) => {
  const file = req.files && req.files[0];

  const item = {
    id: id('feedback'),
    type: 'feedback',
    kind: req.body.kind || 'Отзыв',
    name: req.body.name || req.body.userName || 'Анонимно',
    contact: req.body.contact || '',
    message: req.body.message || '',
    userId: req.body.userId || '',
    userName: req.body.userName || req.body.name || 'Анонимно',
    fileName: file ? file.originalname : '',
    fileUrl: file ? `/api/ft/uploads/${file.filename}` : '',
    createdAt: now()
  };

  push('feedback.json', item, 300);

  audit(`Обратная связь: ${item.kind}`, 'info', item, {
    id: item.userId,
    name: item.userName
  });

  res.json({
    ok: true,
    item
  });
});

router.post('/token-request', jsonParser, (req, res) => {
  const body = req.body || {};

  const item = {
    id: id('token'),
    type: 'token_request',
    kind: 'Запрос токенов',
    name: body.name || (body.user && body.user.name) || 'Клиент',
    contact: body.contact || (body.user && body.user.username) || '',
    message: body.message || 'Клиент запросил токены',
    user: body.user || null,
    createdAt: now()
  };

  push('feedback.json', item, 300);
  audit('Запрос токенов', 'info', item, item.user || null);

  res.json({
    ok: true,
    item
  });
});

router.get('/admin', (_req, res) => {
  const feedback = readJson('feedback.json', []);
  const auditLog = readJson('audit.json', []);
  const photos = readJson('photos.json', []);
  const state = readState();

  const errors = auditLog.filter((item) => item.level === 'error').length;
  const successes = auditLog.filter((item) => /Генерация завершена|Generation result saved|завершена/i.test(item.title || item.message || '')).length;
  const total = errors + successes;
  const stability = total ? Math.max(0, Math.min(100, (successes / total) * 100)) : 100;

  res.json({
    ok: true,
    feedback: feedback.slice(0, 80),
    audit: auditLog.slice(0, 120),
    photos: photos.slice(0, 80),
    active: (state.active || []).slice(0, 20),
    stats: {
      feedback: feedback.length,
      photos: photos.length,
      logs: auditLog.length,
      errors,
      successes,
      stability
    }
  });
});

router.get('/audit/export', (_req, res) => {
  const payload = {
    exportedAt: now(),
    state: readState(),
    feedback: readJson('feedback.json', []),
    photos: readJson('photos.json', []),
    audit: readJson('audit.json', [])
  };

  const name = `fototime-audit-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
  res.send(JSON.stringify(payload, null, 2));
});

module.exports = router;
