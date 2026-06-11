const express = require('express');
const multer = require('multer');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024, files: 3 },
});

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data', 'fototime');
const PUBLIC_DIR = path.join(ROOT, 'public');
const UPLOAD_DIR = path.join(PUBLIC_DIR, 'uploads', 'fototime');
const RESULT_DIR = path.join(PUBLIC_DIR, 'results', 'fototime');

const BALANCE_COST = 40;
const DEMO_USER = {
  id: 'local-demo-user',
  username: 'local-demo-user',
  name: 'local-demo-user',
};

function ensureDirs() {
  [DATA_DIR, PUBLIC_DIR, UPLOAD_DIR, RESULT_DIR].forEach((dir) => {
    fs.mkdirSync(dir, { recursive: true });
  });
}

ensureDirs();

function filePath(name) {
  return path.join(DATA_DIR, name);
}

async function readJson(name, fallback) {
  try {
    const raw = await fsp.readFile(filePath(name), 'utf8');
    return JSON.parse(raw);
  } catch (_) {
    return fallback;
  }
}

async function writeJson(name, value) {
  ensureDirs();
  await fsp.writeFile(filePath(name), JSON.stringify(value, null, 2), 'utf8');
}

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

function cleanText(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function publicUrl(absPath) {
  const rel = path.relative(PUBLIC_DIR, absPath).split(path.sep).join('/');
  const file = path.basename(absPath);

  if (rel.startsWith('uploads/fototime/')) {
    return `/api/fototime/file/uploads/${encodeURIComponent(file)}`;
  }


function ftHardFixHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function ftHardFixLooksDemo(buffer) {
  try {
    const text = buffer.toString('latin1').toLowerCase();
    return /adobe stock|adobestock|stock\.adobe|shutterstock|depositphotos|demo version|watermark/.test(text);
  } catch (_) {
    return false;
  }
}

  if (rel.startsWith('results/fototime/')) {
    return `/api/fototime/file/results/${encodeURIComponent(file)}`;
  }

  return `/${rel}`;
}


function repairStoredUrl(url) {
  const text = String(url || '').trim();
  if (!text) return '';

  const withoutOrigin = text.replace(/^https?:\/\/[^/]+/i, '');
  const match = withoutOrigin.match(/^\/(uploads|results)\/fototime\/([^?#]+)/i);

  if (!match) return text;

  const bucket = match[1].toLowerCase();
  const file = path.basename(decodeURIComponent(match[2]));

  return `/api/fototime/file/${bucket}/${encodeURIComponent(file)}`;
}

function repairDbUrls(db) {
  if (!db || typeof db !== 'object') return db;

  if (Array.isArray(db.generations)) {
    db.generations = db.generations.map((item) => ({
      ...item,
      sourceUrl: repairStoredUrl(item.sourceUrl),
      resultUrl: repairStoredUrl(item.resultUrl),
    }));
  }

  if (Array.isArray(db.feedback)) {
    db.feedback = db.feedback.map((item) => ({
      ...item,
      fileUrl: repairStoredUrl(item.fileUrl),
    }));
  }

  if (db.activeGenerations && typeof db.activeGenerations === 'object') {
    Object.keys(db.activeGenerations).forEach((key) => {
      const item = db.activeGenerations[key];
      db.activeGenerations[key] = {
        ...item,
        sourceUrl: repairStoredUrl(item.sourceUrl),
        resultUrl: repairStoredUrl(item.resultUrl),
      };
    });
  }

  return db;
}

function sendMissingImage(res, name) {
  const safeName = String(name || 'file').replace(/[<>&"]/g, '');
  res.status(200);
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.send(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#baff14"/>
          <stop offset="1" stop-color="#5ee7d0"/>
        </linearGradient>
      </defs>
      <rect width="800" height="800" rx="48" fill="#f7fbf2"/>
      <rect x="70" y="70" width="660" height="660" rx="36" fill="url(#g)" opacity=".22"/>
      <text x="400" y="360" text-anchor="middle" font-family="system-ui, sans-serif" font-size="42" font-weight="900" fill="#17342f">FOTOTIME AI</text>
      <text x="400" y="420" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" font-weight="700" fill="#687a74">Файл не найден</text>
      <text x="400" y="462" text-anchor="middle" font-family="system-ui, sans-serif" font-size="18" font-weight="600" fill="#687a74">${safeName}</text>
    </svg>
  `);
}

function normalizeUser(input = {}) {
  return {
    id: cleanText(input.id || input.userId || input.telegramId, DEMO_USER.id),
    username: cleanText(input.username || input.userName || input.login, DEMO_USER.username),
    name: cleanText(input.name || input.firstName || input.fullName || input.username, DEMO_USER.name),
  };
}

function normalizeProvider(value) {
  const raw = cleanText(value, 'SDXL');
  const low = raw.toLowerCase();

  if (low.includes('flux') || low.includes('edit')) return 'FLUX.2';
  if (low.includes('banana')) return 'Nano Banana';
  if (low.includes('head') || low.includes('голов')) return 'Замена Головы';
  if (low.includes('sdxl')) return 'SDXL';

  return raw;
}

function fallbackStyles() {
  const rows = [
    ['1001', 'Атлантида', 'SDXL'],
    ['1002', 'Барби', 'SDXL'],
    ['1003', 'Баблгам', 'SDXL'],
    ['1004', 'Бизнес', 'SDXL'],
    ['1005', 'Рождество', 'SDXL'],
    ['1006', 'Комикс', 'SDXL'],
    ['1007', 'Киберпанк', 'SDXL'],
    ['1008', 'Дубай', 'SDXL'],
    ['1009', 'Лесная сказка', 'SDXL'],
    ['2001', 'Поле боя', 'FLUX.2'],
    ['2002', 'Кибернетика', 'FLUX.2'],
    ['2003', 'Алхимик', 'FLUX.2'],
    ['2004', 'Пираты', 'FLUX.2'],
    ['2005', 'Кабаре', 'FLUX.2'],
    ['3001', 'White rabbits', 'Nano Banana'],
    ['3002', 'Diamonds', 'Nano Banana'],
    ['3003', 'Luxor', 'Nano Banana'],
    ['3004', 'Biker NB', 'Nano Banana'],
    ['3005', 'Business 001', 'Nano Banana'],
    ['3006', 'Пустыня', 'Nano Banana'],
  ];

  return rows.map(([id, title, provider]) => ({
    id,
    title,
    provider,
    preview: '',
    mode: provider.toLowerCase().replace(/[^a-zа-я0-9]+/gi, '-'),
  }));
}

async function readStyles() {
  const candidates = [
    path.join(PUBLIC_DIR, 'public-styles.json'),
    path.join(PUBLIC_DIR, 'styles.json'),
    path.join(ROOT, 'src', 'client', 'public-styles.json'),
    path.join(ROOT, 'src', 'client', 'styles.json'),
  ];

  let raw = null;

  for (const p of candidates) {
    try {
      raw = JSON.parse(await fsp.readFile(p, 'utf8'));
      break;
    } catch (_) {}
  }

  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.styles)
      ? raw.styles
      : Array.isArray(raw?.items)
        ? raw.items
        : [];

  const normalized = list
    .map((item, index) => {
      const provider = normalizeProvider(
        item.provider ||
        item.styleProvider ||
        item.network ||
        item.neuralNetwork ||
        item.mode ||
        item.styleMode ||
        item.category
      );

      const title = cleanText(
        item.title ||
        item.name ||
        item.label ||
        item.styleName ||
        item.promptName,
        `${provider} ${index + 1}`
      );

      let preview = cleanText(
        item.preview ||
        item.previewUrl ||
        item.image ||
        item.imageUrl ||
        item.cover ||
        item.icon ||
        item.thumbnail ||
        item.thumb,
        ''
      );

      if (
        preview &&
        !preview.startsWith('http') &&
        !preview.startsWith('/') &&
        !preview.startsWith('data:')
      ) {
        preview = `/${preview.replace(/^public\//, '')}`;
      }

      return {
        id: String(item.id || item.styleId || item.localStyleId || item.nsId || item.code || index + 1),
        title,
        provider,
        preview,
        mode: cleanText(item.mode || item.styleMode || item.styleProvider || provider, provider),
        raw: item,
      };
    })
    .filter((item) => item.id && item.title);

  const seen = new Set();

  const unique = normalized.filter((item) => {
    const key = `${item.id}:${item.title}:${item.provider}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.length ? unique : fallbackStyles();
}

async function getDb() {
  const db = await readJson('stable-db.json', null);
  if (db) {
    repairDbUrls(db);
    return db;
  }

  const initial = {
    version: 'stable-v14-clean',
    users: {
      [DEMO_USER.id]: {
        ...DEMO_USER,
        balance: 50,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
    },
    generations: [],
    feedback: [],
    notifications: [
      {
        id: makeId('note'),
        userId: DEMO_USER.id,
        title: 'Сервис настраивается',
        message: 'Мы улучшаем приложение и будем благодарны за обратную связь в личном кабинете.',
        unread: true,
        createdAt: nowIso(),
      },
    ],
    auditSessions: {},
    activeGenerations: {},
  };

  await writeJson('stable-db.json', initial);
  return initial;
}

async function saveDb(db) {
  repairDbUrls(db);
  db.updatedAt = nowIso();
  await writeJson('stable-db.json', db);
}

function getOrCreateUser(db, input = {}) {
  const user = normalizeUser(input);

  if (!db.users[user.id]) {
    db.users[user.id] = {
      ...user,
      balance: 50,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
  } else {
    db.users[user.id] = {
      ...db.users[user.id],
      ...user,
      balance: safeNumber(db.users[user.id].balance, 50),
      updatedAt: nowIso(),
    };
  }

  return db.users[user.id];
}

function getSessionId(body = {}) {
  const user = normalizeUser(body);
  const explicit = cleanText(body.sessionId || body.session || '');

  if (explicit) return explicit;

  const date = new Date().toISOString().slice(0, 10);
  return `${user.id}_${date}`;
}

async function addAudit(db, payload) {
  const user = normalizeUser(payload);
  const sessionId = getSessionId(payload);

  const entry = {
    id: cleanText(payload.id, makeId('audit')),
    title: cleanText(payload.title || payload.message || 'Событие'),
    level: cleanText(payload.level, 'info'),
    type: cleanText(payload.type, 'event'),
    details: payload.details || {},
    user,
    page: cleanText(payload.page, ''),
    unread:
      payload.level === 'error' ||
      payload.important === true ||
      ['feedback', 'token_request', 'generation_error'].includes(payload.type),
    createdAt: cleanText(payload.createdAt, nowIso()),
  };

  if (!db.auditSessions[sessionId]) {
    db.auditSessions[sessionId] = {
      id: sessionId,
      user,
      startedAt: entry.createdAt,
      updatedAt: entry.createdAt,
      unread: false,
      entries: [],
      errors: [],
    };
  }

  const session = db.auditSessions[sessionId];

  session.user = user;
  session.updatedAt = entry.createdAt;
  session.entries.unshift(entry);
  session.entries = session.entries.slice(0, 200);

  if (entry.level === 'error') {
    session.errors.unshift(entry);
    session.errors = session.errors.slice(0, 50);
  }

  if (entry.unread) session.unread = true;

  return entry;
}

async function notifyTelegram(title, message) {
  const token = process.env.FT_ADMIN_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.FT_ADMIN_TELEGRAM_CHAT_ID;

  if (!token || !chatId || typeof fetch !== 'function') return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `${title}\n${message || ''}`.trim(),
        disable_web_page_preview: true,
      }),
    });
  } catch (error) {
    console.warn('[FOTOTIME] Telegram notify failed:', error.message);
  }
}

function adminPayload(db) {
  const sessions = Object.values(db.auditSessions || {}).sort((a, b) =>
    String(b.updatedAt).localeCompare(String(a.updatedAt))
  );

  const errors = sessions
    .flatMap((s) => (s.errors || []).map((e) => ({ ...e, sessionId: s.id })))
    .slice(0, 30);

  const visibleSessions = sessions.map((s) => ({
    id: s.id,
    user: s.user,
    startedAt: s.startedAt,
    updatedAt: s.updatedAt,
    unread: Boolean(s.unread),
    entriesCount: (s.entries || []).length,
    errorsCount: (s.errors || []).length,
    important: (s.entries || [])
      .filter((e) => e.unread || e.level === 'error' || e.type === 'feedback' || e.type === 'token_request')
      .slice(0, 12),
    entries: (s.entries || []).slice(0, 30),
  }));

  const totalEvents = sessions.reduce((sum, s) => sum + (s.entries || []).length, 0);
  const totalErrors = errors.length;
  const stability = totalEvents ? Math.max(0, Math.round(((totalEvents - totalErrors) / totalEvents) * 100)) : 100;

  return {
    users: Object.values(db.users || {}),
    feedback: (db.feedback || []).slice(-30).reverse(),
    generations: (db.generations || []).slice(-40).reverse(),
    photos: (db.generations || []).filter((g) => g.sourceUrl || g.resultUrl).slice(-40).reverse(),
    sessions: visibleSessions,
    errors,
    activeGenerations: Object.values(db.activeGenerations || {}),
    stability,
  };
}


router.get('/file/:bucket/:name', async (req, res) => {
  try {
    const bucket = String(req.params.bucket || '').toLowerCase();
    const name = path.basename(String(req.params.name || ''));

    if (!name || !['uploads', 'results'].includes(bucket)) {
      return sendMissingImage(res, name || 'unknown');
    }

    const baseDir = bucket === 'uploads' ? UPLOAD_DIR : RESULT_DIR;
    const abs = path.join(baseDir, name);

    if (!fs.existsSync(abs)) {
      return sendMissingImage(res, name);
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.sendFile(abs);
  } catch (error) {
    console.error('[FOTOTIME] file endpoint error:', error);
    return sendMissingImage(res, 'error');
  }
});

router.get('/state', async (req, res) => {
  const db = await getDb();
  const user = getOrCreateUser(db, req.query || {});
  const styles = await readStyles();

  await saveDb(db);

  res.json({
    ok: true,
    version: 'stable-v14-clean',
    user,
    balance: safeNumber(user.balance, 50),
    cost: BALANCE_COST,
    styles,
    generations: (db.generations || []).filter((g) => g.userId === user.id).slice(-20).reverse(),
    notifications: (db.notifications || []).filter((n) => !n.userId || n.userId === user.id).slice(-20).reverse(),
  });
});

router.get('/styles', async (_req, res) => {
  res.json({ ok: true, styles: await readStyles() });
});

router.post('/audit', express.json({ limit: '1mb' }), async (req, res) => {
  const db = await getDb();
  const entry = await addAudit(db, req.body || {});

  await saveDb(db);

  res.json({ ok: true, entry });
});

router.post('/balance/refresh', express.json({ limit: '1mb' }), async (req, res) => {
  const db = await getDb();
  const user = getOrCreateUser(db, req.body || {});

  await addAudit(db, {
    ...req.body,
    title: 'Баланс синхронизирован',
    type: 'balance_refresh',
    details: { balance: user.balance },
  });

  await saveDb(db);

  res.json({
    ok: true,
    balance: safeNumber(user.balance, 50),
    user,
  });
});

router.post('/balance/set', express.json({ limit: '1mb' }), async (req, res) => {
  const db = await getDb();
  const user = getOrCreateUser(db, {
    id: req.body.userId,
    username: req.body.username,
    name: req.body.name,
  });

  const balance = Math.max(0, Math.floor(safeNumber(req.body.balance, user.balance)));

  user.balance = balance;
  user.updatedAt = nowIso();

  const note = {
    id: makeId('note'),
    userId: user.id,
    title: 'Баланс обновлён',
    message: `Администратор обновил баланс. Сейчас доступно ${balance} кредитов.`,
    unread: true,
    createdAt: nowIso(),
  };

  db.notifications.unshift(note);

  await addAudit(db, {
    title: 'Баланс пользователя изменён',
    type: 'admin_balance_set',
    important: true,
    details: { userId: user.id, balance },
  });

  await saveDb(db);

  res.json({ ok: true, user, notification: note });
});

router.post('/receipt/send', express.json({ limit: '1mb' }), async (req, res) => {
  const db = await getDb();
  const user = getOrCreateUser(db, { id: req.body.userId });

  const note = {
    id: makeId('note'),
    userId: user.id,
    title: 'Информация об оплате',
    message: cleanText(
      req.body.message,
      'Оплата получена. Чек от самозанятого будет отправлен администратором после проверки.'
    ),
    unread: true,
    createdAt: nowIso(),
  };

  db.notifications.unshift(note);

  await addAudit(db, {
    title: 'Уведомление о чеке отправлено',
    type: 'receipt_notice',
    important: true,
    details: { userId: user.id },
  });

  await saveDb(db);

  res.json({ ok: true, notification: note });
});

router.post('/notifications/read', express.json({ limit: '1mb' }), async (req, res) => {
  const db = await getDb();
  const user = normalizeUser(req.body || {});

  db.notifications = (db.notifications || []).map((n) =>
    n.userId === user.id ? { ...n, unread: false } : n
  );

  await saveDb(db);

  res.json({ ok: true });
});

router.post('/feedback', upload.any(), async (req, res) => {
  const db = await getDb();
  const user = getOrCreateUser(db, req.body || {});
  const file = (req.files || [])[0] || null;

  let fileUrl = '';

  if (file) {
    const ext = path.extname(file.originalname || '') || '.jpg';
    const fileName = `${makeId('feedback')}${ext}`;
    const abs = path.join(UPLOAD_DIR, fileName);

    await fsp.writeFile(abs, file.buffer);
    fileUrl = publicUrl(abs);
  }

  const item = {
    id: makeId('feedback'),
    type: cleanText(req.body.kind || req.body.type, 'Отзыв'),
    name: cleanText(req.body.name, 'Анонимно'),
    contact: cleanText(req.body.contact, ''),
    message: cleanText(req.body.message, ''),
    userId: user.id,
    userName: user.username,
    fileName: file?.originalname || '',
    fileUrl,
    unread: true,
    createdAt: nowIso(),
  };

  db.feedback.unshift(item);
  db.feedback = db.feedback.slice(0, 100);

  await addAudit(db, {
    ...user,
    title: item.type === 'Запрос токенов' ? 'Запрос токенов' : 'Обратная связь отправлена',
    type: item.type === 'Запрос токенов' ? 'token_request' : 'feedback',
    important: true,
    details: item,
  });

  await saveDb(db);

  await notifyTelegram(`FOTOTIME323: ${item.type}`, `${item.name}\n${item.contact}\n${item.message}`);

  res.json({ ok: true, item });
});

router.post('/generate', upload.any(), async (req, res) => {
  const db = await getDb();
  const user = getOrCreateUser(db, req.body || {});
  const balance = safeNumber(user.balance, 50);

  const selected = {
    id: cleanText(req.body.styleId || req.body.id, ''),
    title: cleanText(req.body.styleTitle || req.body.title, 'AI photo'),
    provider: normalizeProvider(req.body.provider || req.body.styleProvider || req.body.mode),
  };

  const participant = cleanText(req.body.participant, '');
  const source = (req.files || [])[0] || null;

  const payloadInfo = {
    selected,
    participant,
    hasFile: Boolean(source),
    fileName: source?.originalname || '',
    balance,
  };

  const jobId = makeId('generation');

  if (!source) {
    const entry = await addAudit(db, {
      ...user,
      title: 'Ошибка генерации',
      level: 'error',
      type: 'generation_error',
      important: true,
      details: { message: 'Не загружено исходное фото', ...payloadInfo },
    });

    await saveDb(db);

    return res.status(400).json({
      ok: false,
      code: 'NO_FILE',
      message: 'Загрузите фото перед генерацией.',
      audit: entry,
    });
  }

  if (!selected.id) {
    const entry = await addAudit(db, {
      ...user,
      title: 'Ошибка генерации',
      level: 'error',
      type: 'generation_error',
      important: true,
      details: { message: 'Не выбран стиль', ...payloadInfo },
    });

    await saveDb(db);

    return res.status(400).json({
      ok: false,
      code: 'NO_STYLE',
      message: 'Выберите стиль обработки.',
      audit: entry,
    });
  }

  if (balance < BALANCE_COST) {
    const entry = await addAudit(db, {
      ...user,
      title: 'Ошибка генерации',
      level: 'error',
      type: 'generation_error',
      important: true,
      details: {
        message: `Недостаточно кредитов: нужно ${BALANCE_COST}, доступно ${balance}`,
        ...payloadInfo,
      },
    });

    await saveDb(db);

    return res.status(402).json({
      ok: false,
      code: 'NOT_ENOUGH_CREDITS',
      message: `Недостаточно кредитов. Нужно ${BALANCE_COST}, доступно ${balance}. Пополните баланс в личном кабинете.`,
      balance,
      audit: entry,
    });
  }

  const ext = path.extname(source.originalname || '') || '.jpg';
  const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext.toLowerCase()) ? ext : '.jpg';
  const sourceName = `${jobId}_source${safeExt}`;
  const resultName = `${jobId}_result${safeExt}`;
  const sourceAbs = path.join(UPLOAD_DIR, sourceName);
  const resultAbs = path.join(RESULT_DIR, resultName);
  const sourceUrl = publicUrl(sourceAbs);
  const resultUrl = publicUrl(resultAbs);

  db.activeGenerations[jobId] = {
    id: jobId,
    userId: user.id,
    userName: user.username,
    title: `Запуск генерации · ${selected.title} · ${selected.provider}`,
    selected,
    participant,
    sourceUrl,
    startedAt: nowIso(),
    status: 'active',
  };

  await addAudit(db, {
    ...user,
    title: 'Генерация запущена',
    type: 'generation_start',
    important: true,
    details: { jobId, ...payloadInfo },
  });

  await saveDb(db);

  try {
    await fsp.writeFile(sourceAbs, source.buffer);

    await new Promise((resolve) => setTimeout(resolve, 900));

    // Стабильный локальный контур: пока внешний provider-adapter не подключён,
    // результатом будет копия исходного фото. UI, баланс, история, аудит и админка работают стабильно.
    await fsp.writeFile(resultAbs, source.buffer);

  try {
    const resultBufferCheck = await fsp.readFile(resultAbs);
    const sourceHashCheck = ftHardFixHash(source.buffer);
    const resultHashCheck = ftHardFixHash(resultBufferCheck);

    if (sourceHashCheck === resultHashCheck || ftHardFixLooksDemo(resultBufferCheck)) {
      const entry = await addAudit(db, {
        ...user,
        title: 'Ошибка генерации',
        level: 'error',
        type: 'generation_error',
        important: true,
        details: {
          message: 'Провайдер вернул исходник или demo/stock результат',
          selected,
          participant,
          fileName: source?.originalname || '',
          resultUrl,
          sourceUrl,
        },
      });

      await saveDb(db);

      return res.status(502).json({
        ok: false,
        code: 'GENERATION_RESULT_INVALID',
        message: 'Провайдер вернул исходник или demo/stock изображение. Ложный успех отключён. Кредиты не списаны.',
        audit: entry,
        balance,
      });
    }
  } catch (e) {
    const entry = await addAudit(db, {
      ...user,
      title: 'Ошибка генерации',
      level: 'error',
      type: 'generation_error',
      important: true,
      details: {
        message: 'Не удалось проверить результат генерации',
        error: e.message,
      },
    });

    await saveDb(db);

    return res.status(502).json({
      ok: false,
      code: 'GENERATION_RESULT_CHECK_FAILED',
      message: 'Не удалось проверить результат генерации. Кредиты не списаны.',
      audit: entry,
      balance,
    });
  }

    user.balance = Math.max(0, balance - BALANCE_COST);
    user.updatedAt = nowIso();

    const generation = {
      id: jobId,
      userId: user.id,
      userName: user.username,
      styleId: selected.id,
      styleTitle: selected.title,
      provider: selected.provider,
      participant,
      sourceUrl,
      resultUrl,
      cost: BALANCE_COST,
      balanceBefore: balance,
      balanceAfter: user.balance,
      status: 'success',
      createdAt: nowIso(),
    };

    db.generations.unshift(generation);
    db.generations = db.generations.slice(0, 200);

    delete db.activeGenerations[jobId];

    await addAudit(db, {
      ...user,
      title: 'Генерация завершена',
      type: 'generation_success',
      important: true,
      details: generation,
    });

    await saveDb(db);

    return res.json({
      ok: true,
      generation,
      resultUrl,
      sourceUrl,
      balance: user.balance,
      cost: BALANCE_COST,
    });
  } catch (error) {
    delete db.activeGenerations[jobId];

    const entry = await addAudit(db, {
      ...user,
      title: 'Ошибка генерации',
      level: 'error',
      type: 'generation_error',
      important: true,
      details: { message: error.message, jobId, ...payloadInfo },
    });

    await saveDb(db);
    await notifyTelegram('FOTOTIME323: ошибка генерации', `${user.username}: ${error.message}`);

    return res.status(500).json({
      ok: false,
      code: 'GENERATION_FAILED',
      message: 'Генерация не завершилась. Ошибка записана в админ-консоль.',
      audit: entry,
    });
  }
});

router.get('/admin', async (_req, res) => {
  const db = await getDb();

  res.json({
    ok: true,
    ...adminPayload(db),
  });
});

router.post('/admin/read-all', express.json({ limit: '1mb' }), async (_req, res) => {
  const db = await getDb();

  Object.values(db.auditSessions || {}).forEach((session) => {
    session.unread = false;
    (session.entries || []).forEach((entry) => {
      entry.unread = false;
    });
  });

  (db.feedback || []).forEach((item) => {
    item.unread = false;
  });

  await saveDb(db);

  res.json({ ok: true });
});

router.get('/admin/audit-download', async (_req, res) => {
  const db = await getDb();

  const payload = {
    exportedAt: nowIso(),
    version: db.version,
    admin: adminPayload(db),
    raw: db,
  };

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="fototime-audit-${new Date().toISOString().replace(/[:.]/g, '-')}.json"`
  );

  res.send(JSON.stringify(payload, null, 2));
});

router.get('/health', async (_req, res) => {
  res.json({
    ok: true,
    version: 'stable-v14-clean',
    time: nowIso(),
  });
});

module.exports = router;
