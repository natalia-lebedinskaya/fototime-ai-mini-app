
/* FT_FINAL_SERVER_DEFAULTS_20260608 */
process.env.ADMIN_PIN = String(process.env.ADMIN_PIN || '3465,3230');
process.env.ALLOW_LOCAL_AUTH = String(process.env.ALLOW_LOCAL_AUTH || 'true');


/* FT_FORCE_LOCAL_AUTH_SERVER_DEFAULT_20260608 */
process.env.ALLOW_LOCAL_AUTH = String(process.env.ALLOW_LOCAL_AUTH || 'true');
process.env.ADMIN_PIN = String(process.env.ADMIN_PIN || '3465,3230');


// FT_V31_CRITICAL_ROUTE_START
const ftV31CriticalErrorsRoute = require('./routes/ftCriticalErrors');
// FT_V31_CRITICAL_ROUTE_END
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const healthRoute = require('./routes/health');
const configRoute = require('./routes/config');
const generateRoute = require('./routes/generate');
const stylesRoute = require('./routes/styles');
const userRoute = require('./routes/user');
const adminRoute = require('./routes/admin');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express()

// FT_V37_STYLE_PREVIEW_ROUTE_START
app.get('/api/fototime/style-preview/:slug', (req, res) => {
  const rawTitle = String(req.query.title || req.params.slug || 'FOTOTIME');
  const title = rawTitle.slice(0, 48);

  function ftXmlEscape(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  const palettes = [
    ['#74f0d1', '#baff14', '#11362f'],
    ['#ffd166', '#ff8fab', '#3a211f'],
    ['#7bdff2', '#b2f7ef', '#1f3b4d'],
    ['#cdb4db', '#ffc8dd', '#2f2338'],
    ['#a0c4ff', '#fdffb6', '#172a46'],
    ['#95d5b2', '#d8f3dc', '#123524']
  ];

  let hash = 0;
  for (let i = 0; i < title.length; i += 1) hash = (hash + title.charCodeAt(i) * (i + 1)) % 9999;
  const p = palettes[hash % palettes.length];

  const safeTitle = ftXmlEscape(title);
  const initials = ftXmlEscape(
    title
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => x[0])
      .join('')
      .toUpperCase() || 'FT'
  );

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="900" height="1200" viewBox="0 0 900 1200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${p[0]}"/>
      <stop offset="52%" stop-color="${p[1]}"/>
      <stop offset="100%" stop-color="${p[0]}"/>
    </linearGradient>
    <radialGradient id="r" cx="22%" cy="12%" r="78%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity=".78"/>
      <stop offset="44%" stop-color="#ffffff" stop-opacity=".08"/>
      <stop offset="100%" stop-color="#000000" stop-opacity=".18"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="24" stdDeviation="26" flood-color="#000000" flood-opacity=".22"/>
    </filter>
  </defs>

  <rect width="900" height="1200" rx="54" fill="url(#g)"/>
  <rect width="900" height="1200" rx="54" fill="url(#r)"/>

  <circle cx="720" cy="170" r="118" fill="#ffffff" opacity=".22"/>
  <circle cx="145" cy="1020" r="170" fill="#ffffff" opacity=".16"/>
  <circle cx="710" cy="980" r="210" fill="#000000" opacity=".08"/>

  <g filter="url(#shadow)">
    <rect x="90" y="115" width="720" height="835" rx="42" fill="#ffffff" opacity=".55"/>
    <rect x="125" y="155" width="650" height="755" rx="32" fill="#ffffff" opacity=".36"/>
  </g>

  <text x="450" y="482" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="148" font-weight="900" fill="${p[2]}" opacity=".92">${initials}</text>

  <text x="450" y="1012" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="52" font-weight="900" fill="${p[2]}">${safeTitle}</text>

  <text x="450" y="1082" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="32" font-weight="800" fill="${p[2]}" opacity=".72">FOTOTIME AI STYLE</text>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(svg);
});
// FT_V37_STYLE_PREVIEW_ROUTE_END
;

/* FT_V35_SERVER_NOTIFY_START */
const { ftTelegramNotifyAdmin } = require("./services/ftTelegramNotifyService");

function ftV35SafeBody(req) {
  try {
    return req.body && typeof req.body === "object" ? req.body : {};
  } catch (_) {
    return {};
  }
}

app.use((req, res, next) => {
  const method = String(req.method || "").toUpperCase();
  const url = String(req.originalUrl || req.url || "");

  const shouldNotify =
    method === "POST" &&
    (
      url.includes("/api/feedback/token-request") ||
      url.includes("/api/feedback")
    ) &&
    !url.includes("/admin");

  if (!shouldNotify) return next();

  res.on("finish", () => {
    if (res.statusCode >= 400) return;

    const body = ftV35SafeBody(req);
    const isTokenRequest = url.includes("/token-request");

    const name = body.name || body.userName || body.username || "не указано";
    const contact = body.contact || body.telegram || body.phone || body.username || "не указано";
    const message = body.message || body.text || body.description || "";

    const title = isTokenRequest
      ? "🔔 FOTOTIME323: клиент запросил токены"
      : "💬 FOTOTIME323: новое обращение / отзыв";

    const text = [
      `<b>${title}</b>`,
      "",
      `<b>Имя:</b> ${String(name).slice(0, 120)}`,
      `<b>Контакт:</b> ${String(contact).slice(0, 160)}`,
      message ? `<b>Сообщение:</b> ${String(message).slice(0, 900)}` : "",
      "",
      `<b>Источник:</b> ${url}`
    ].filter(Boolean).join("\n");

    ftTelegramNotifyAdmin(text).catch((error) => {
      console.error("[FOTOTIME feedback telegram notify error]", error);
    });
  });

  next();
});

app.get("/api/fototime/critical-errors", (req, res) => {
  const fs = require("fs");
  const path = require("path");
  const file = path.join(process.cwd(), "data", "critical-errors.json");

  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

  if (!fs.existsSync(file)) {
    return res.json({ ok: true, errors: [] });
  }

  try {
    const errors = JSON.parse(fs.readFileSync(file, "utf-8"));
    return res.json({ ok: true, errors: Array.isArray(errors) ? errors : [] });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      code: "CRITICAL_ERRORS_READ_FAILED",
      message: error.message
    });
  }
});
/* FT_V35_SERVER_NOTIFY_END */


/* FT_DEPLOY_CACHE_BUST_V1 */
const FT_DEPLOY_VERSION = process.env.FT_DEPLOY_VERSION || "fototime-prod-20260610-141454";

app.use((req, res, next) => {
  const noCachePaths = [
    "/",
    "/index.html",
    "/api/fototime/version"
  ];

  const noCacheExtensions = [
    ".html",
    ".js",
    ".css",
    ".json",
    ".map"
  ];

  const shouldNoCache =
    noCachePaths.includes(req.path) ||
    noCacheExtensions.some((ext) => req.path.endsWith(ext));

  if (shouldNoCache) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
  }

  next();
});

app.get("/api/fototime/version", (req, res) => {
  res.json({
    ok: true,
    version: FT_DEPLOY_VERSION,
    commit: process.env.RENDER_GIT_COMMIT || process.env.COMMIT_SHA || null,
    branch: process.env.RENDER_GIT_BRANCH || null,
    nodeEnv: process.env.NODE_ENV || null,
    time: new Date().toISOString()
  });
});


const fototimeStableRouter = require('./routes/fototimeStable');
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
app.use('/api/fototime', fototimeStableRouter);
app.use('/api/ft', require('./routes/ftStable'));

app.use(cors());

/* FT_STATIC_ASSETS_STABLE_20260608 */
app.use('/assets', express.static(path.join(__dirname, '..', 'client', 'assets'), {
  maxAge: '1h',
  fallthrough: true
}));


// FT_STATIC_ASSETS_FIX_20260609_START
app.use('/assets', express.static(path.join(__dirname, '../client/assets'), {
  etag: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store');
  }
}));
// FT_STATIC_ASSETS_FIX_20260609_END

app.use(express.json());
app.use('/api/image-proxy', require('./routes/imageProxy'));
app.use('/api/generation-logs', require('./routes/generationLogs'));
app.use('/api/feedback', require('./routes/feedback'));



app.get('/api/version', (_req, res) => {
  const packageJson = require('../../package.json');

  const commit =
    process.env.RENDER_GIT_COMMIT ||
    process.env.GIT_COMMIT ||
    'local';

  res.json({
    version: packageJson.version || '0.1.0',
    commit: commit === 'local' ? 'local' : String(commit).slice(0, 7),
    environment: process.env.NODE_ENV || 'development',
    buildDate: new Date().toISOString()
  });
});

app.use('/storage', express.static(path.join(process.cwd(), 'storage')));
app.use('/assets', express.static(path.join(__dirname, '..', 'client', 'assets')));
app.use('/assets', express.static(path.join(process.cwd(), 'public', 'assets')));
app.use('/public', express.static(path.join(process.cwd(), 'public')));
app.use(express.static(path.join(__dirname, '../client')));

app.use('/api/health', healthRoute);
app.use('/api/event-config', configRoute);
app.use('/api/generate', generateRoute);


/* FT_PUBLIC_STYLES_SERVER_ALIAS_20260609_START */
app.use('/public-styles.json', stylesRoute);
app.use('/assets/public-styles.json', stylesRoute);
/* FT_PUBLIC_STYLES_SERVER_ALIAS_20260609_END */

app.use('/api/styles', stylesRoute);
app.use('/api/user', userRoute);
app.use('/api/admin-pin', require('./routes/adminPin'));
app.use('/api/styles', require('./routes/styles'));
app.use('/api/event/styles', require('./routes/styles'));
app.use('/api/config/styles', require('./routes/styles'));
app.use('/api/styles/public', require('./routes/styles'));
app.use('/api/admin', adminRoute);

app.use(errorHandler);


const HOST = process.env.HOST || '0.0.0.0';

/* FT_RENDER_PORT_BIND_FINAL_20260608 */
const PORT = Number(process.env.PORT || 3000);
/* FT_RENDER_SINGLE_PORT_20260608_V5 */


/* FT_V16_FILE_STATIC_START */
try {
  const path = require("path");
  const fs = require("fs");

  const publicDir = path.join(process.cwd(), "public");
  const uploadDir = path.join(publicDir, "uploads", "fototime");
  const resultDir = path.join(publicDir, "results", "fototime");

  fs.mkdirSync(uploadDir, { recursive: true });
  fs.mkdirSync(resultDir, { recursive: true });

  if (typeof app !== "undefined" && app && typeof app.use === "function") {
    app.use("/uploads/fototime", express.static(uploadDir));
    app.use("/results/fototime", express.static(resultDir));

    app.get("/api/fototime/file/:bucket/:name", (req, res) => {
      const bucket = String(req.params.bucket || "");
      const name = path.basename(String(req.params.name || ""));
      const dir = bucket === "uploads" ? uploadDir : bucket === "results" ? resultDir : null;

      if (!dir || !name) {
        return res.status(404).send("Not found");
      }

      const file = path.join(dir, name);

      if (!fs.existsSync(file)) {
        return res.status(404).send("Not found");
      }

      res.sendFile(file);
    });

    app.get("/api/fototime/version", (_req, res) => {
      res.json({
        ok: true,
        version: "fototime-prod-20260611-201500-v37-preview-admin-fix",
        updatedAt: new Date().toISOString()
      });
    });
  }
} catch (error) {
  console.error("[FOTOTIME] file static patch failed", error);
}
/* FT_V16_FILE_STATIC_END */


// FT_V31_CRITICAL_ROUTE_USE_START
app.use('/api/fototime/critical-errors', ftV31CriticalErrorsRoute);
// FT_V31_CRITICAL_ROUTE_USE_END

app.listen(PORT, HOST, () => {
  console.log(`FOTOTIME AI server is listening on http://${HOST}:${PORT}`);
});
