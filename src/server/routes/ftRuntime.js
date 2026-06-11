
/* FT_RUNTIME_ROUTE_V17 */
const express = require("express");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const VERSION = "fototime-prod-20260611-150000-v29-safari-safe";
const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, "public");
const UPLOAD_DIR = path.join(PUBLIC_DIR, "uploads", "fototime");
const RESULT_DIR = path.join(PUBLIC_DIR, "results", "fototime");
const STYLE_PREVIEW_DIR = path.join(PUBLIC_DIR, "assets", "style-previews");

for (const dir of [UPLOAD_DIR, RESULT_DIR, STYLE_PREVIEW_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

function safeName(value) {
  return path.basename(String(value || ""));
}

function sendFileIfExists(res, file) {
  if (!file || !fs.existsSync(file)) {
    return false;
  }
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.sendFile(file);
  return true;
}

function findPreviewFile(slug) {
  const safeSlug = String(slug || "").toLowerCase().replace(/[^a-z0-9а-яё_-]+/gi, "-");
  const files = fs.readdirSync(STYLE_PREVIEW_DIR).filter((file) =>
    /\.(jpg|jpeg|png|webp|svg)$/i.test(file)
  );

  return files.find((file) => {
    const lower = file.toLowerCase();
    return lower.startsWith(safeSlug + ".") || lower.includes(safeSlug);
  });
}

function fallbackSvg(slug) {
  const raw = String(slug || "style").replace(/[-_]+/g, " ").trim();
  const label = raw
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0])
    .join("")
    .toUpperCase() || "FT";

  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="720" height="960" viewBox="0 0 720 960">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#c8ff1d"/>
        <stop offset="100%" stop-color="#5fe8d2"/>
      </linearGradient>
    </defs>
    <rect width="720" height="960" rx="44" fill="url(#g)"/>
    <circle cx="540" cy="170" r="92" fill="rgba(255,255,255,.20)"/>
    <circle cx="180" cy="780" r="130" fill="rgba(255,255,255,.14)"/>
    <text x="50%" y="49%" text-anchor="middle" dominant-baseline="middle"
      font-family="Arial, sans-serif" font-size="118" font-weight="900" fill="#15352d">${label}</text>
    <text x="50%" y="61%" text-anchor="middle"
      font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="rgba(21,53,45,.72)">FOTOTIME323</text>
  </svg>`;
}

router.get("/api/fototime/version", (_req, res) => {
  res.json({
    ok: true,
    version: VERSION,
    source: "ft-runtime-v17",
    updatedAt: new Date().toISOString()
  });
});

router.get("/api/fototime/file/:bucket/:name", (req, res) => {
  const bucket = String(req.params.bucket || "");
  const name = safeName(req.params.name);

  const dir =
    bucket === "uploads" ? UPLOAD_DIR :
    bucket === "results" ? RESULT_DIR :
    null;

  if (!dir || !name) {
    return res.status(404).send("Not found");
  }

  const file = path.join(dir, name);

  if (!sendFileIfExists(res, file)) {
    return res.status(404).send("Not found");
  }
});

router.get("/api/fototime/style-preview/:slug", (req, res) => {
  const slug = safeName(req.params.slug || "style");
  const file = findPreviewFile(slug);

  if (file) {
    return sendFileIfExists(res, path.join(STYLE_PREVIEW_DIR, file));
  }

  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(fallbackSvg(slug));
});

router.get("/api/fototime/selftest", (_req, res) => {
  const previews = fs.readdirSync(STYLE_PREVIEW_DIR).filter((file) =>
    /\.(jpg|jpeg|png|webp|svg)$/i.test(file)
  );

  const uploads = fs.readdirSync(UPLOAD_DIR).filter((file) =>
    /\.(jpg|jpeg|png|webp)$/i.test(file)
  );

  const results = fs.readdirSync(RESULT_DIR).filter((file) =>
    /\.(jpg|jpeg|png|webp)$/i.test(file)
  );

  res.json({
    ok: true,
    version: VERSION,
    previews: previews.length,
    uploads: uploads.length,
    results: results.length,
    dirs: {
      stylePreviewDir: STYLE_PREVIEW_DIR,
      uploadDir: UPLOAD_DIR,
      resultDir: RESULT_DIR
    }
  });
});

module.exports = router;
