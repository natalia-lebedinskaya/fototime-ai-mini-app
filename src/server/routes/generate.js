

// FT_V31_MONEY_GUARD_START
const ftV31fs = require('fs');
const ftV31path = require('path');
const ftV31crypto = require('crypto');

function ftV31ResolveFilePath(filePath) {
  if (!filePath) return null;

  const raw = String(filePath);
  if (/^https?:\/\//i.test(raw)) return null;

  const clean = raw.replace(/^\/+/, '');
  const candidates = [
    ftV31path.isAbsolute(raw) ? raw : null,
    ftV31path.join(process.cwd(), clean),
    ftV31path.join(process.cwd(), 'public', clean.replace(/^public\//, ''))
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      if (ftV31fs.existsSync(candidate) && ftV31fs.statSync(candidate).isFile()) {
        return candidate;
      }
    } catch (_) {}
  }

  return null;
}

function ftV31HashFileSafe(filePath) {
  const resolved = ftV31ResolveFilePath(filePath);
  if (!resolved) return null;

  try {
    return ftV31crypto
      .createHash('sha256')
      .update(ftV31fs.readFileSync(resolved))
      .digest('hex');
  } catch (_) {
    return null;
  }
}

function ftV31FileSizeSafe(filePath) {
  const resolved = ftV31ResolveFilePath(filePath);
  if (!resolved) return 0;

  try {
    return ftV31fs.statSync(resolved).size || 0;
  } catch (_) {
    return 0;
  }
}

function ftV31NormalizeComparableUrl(value) {
  try {
    return decodeURIComponent(String(value || ''))
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\/[^/]+/i, '')
      .split('#')[0]
      .split('?')[0]
      .replace(/\/+/g, '/');
  } catch (_) {
    return String(value || '').trim().toLowerCase();
  }
}

function ftV31LooksLikeDemoPreviewUrl(value) {
  const url = ftV31NormalizeComparableUrl(value);

  if (!url) return false;

  const badMarkers = [
    '/assets/',
    'style-preview',
    'style_previews',
    'preview',
    'mock-result',
    'mock_result',
    'placeholder',
    'sample',
    'demo',
    'watermark',
    'stock.adobe',
    'adobestock',
    'adobe-stock',
    'shutterstock',
    'depositphotos'
  ];

  return badMarkers.some((marker) => url.includes(marker));
}

function ftV31FileContainsDemoMarkers(filePath) {
  const resolved = ftV31ResolveFilePath(filePath);
  if (!resolved) return false;

  try {
    const stat = ftV31fs.statSync(resolved);
    const maxBytes = Math.min(stat.size, 6 * 1024 * 1024);
    const fd = ftV31fs.openSync(resolved, 'r');
    const buffer = Buffer.alloc(maxBytes);

    ftV31fs.readSync(fd, buffer, 0, maxBytes, 0);
    ftV31fs.closeSync(fd);

    const text = buffer.toString('latin1').toLowerCase();

    const demoMarkers = [
      'adobe stock',
      'adobestock',
      'adobe-stock',
      'stock.adobe',
      'demo version',
      'watermark',
      'shutterstock',
      'depositphotos'
    ];

    return demoMarkers.some((marker) => text.includes(marker));
  } catch (_) {
    return false;
  }
}

function ftV31RecordCriticalError(type, message, details = {}) {
  const item = {
    id: `critical_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    severity: 'critical',
    status: 'NEW',
    type,
    title: message,
    message,
    details,
    createdAt: new Date().toISOString()
  };

  try {
    const dir = ftV31path.join(process.cwd(), 'data');
    ftV31fs.mkdirSync(dir, { recursive: true });

    const file = ftV31path.join(dir, 'critical-errors.json');
    let list = [];

    if (ftV31fs.existsSync(file)) {
      const parsed = JSON.parse(ftV31fs.readFileSync(file, 'utf-8'));
      list = Array.isArray(parsed) ? parsed : Array.isArray(parsed.items) ? parsed.items : [];
    }

    list.unshift(item);
    ftV31fs.writeFileSync(file, JSON.stringify(list.slice(0, 300), null, 2), 'utf-8');
  } catch (error) {
    console.error('[FOTOTIME CRITICAL WRITE FAILED]', error);
  }

  console.error('[FOTOTIME CRITICAL]', item);
  return item;
}

function ftV31ValidateGeneratedResult(sourcePath, resultPath, meta = {}) {
  const sourceResolved = ftV31ResolveFilePath(sourcePath);
  const resultResolved = ftV31ResolveFilePath(resultPath);

  const sourceHash = ftV31HashFileSafe(sourcePath);
  const resultHash = ftV31HashFileSafe(resultPath);

  const sourceSize = ftV31FileSizeSafe(sourcePath);
  const resultSize = ftV31FileSizeSafe(resultPath);

  const resultUrl = meta.resultUrl || meta.resultImage || resultPath || '';
  const stylePreviewUrl = meta.stylePreviewUrl || meta.requestedStylePreviewUrl || '';

  const normalizedResultUrl = ftV31NormalizeComparableUrl(resultUrl);
  const normalizedStylePreviewUrl = ftV31NormalizeComparableUrl(stylePreviewUrl);

  const reasons = [];

  if (!sourceResolved) reasons.push('SOURCE_FILE_MISSING');
  if (!resultResolved) reasons.push('RESULT_FILE_MISSING');
  if (resultResolved && resultSize < 1024) reasons.push('RESULT_FILE_TOO_SMALL');

  if (sourceHash && resultHash && sourceHash === resultHash) {
    reasons.push('RESULT_EQUALS_SOURCE');
  }

  if (sourceResolved && resultResolved && sourceResolved === resultResolved) {
    reasons.push('RESULT_PATH_EQUALS_SOURCE_PATH');
  }

  if (normalizedResultUrl && normalizedStylePreviewUrl && normalizedResultUrl === normalizedStylePreviewUrl) {
    reasons.push('RESULT_URL_EQUALS_STYLE_PREVIEW');
  }

  if (ftV31LooksLikeDemoPreviewUrl(resultUrl)) {
    reasons.push('RESULT_URL_LOOKS_LIKE_DEMO_OR_PREVIEW');
  }

  if (ftV31LooksLikeDemoPreviewUrl(stylePreviewUrl) && normalizedResultUrl === normalizedStylePreviewUrl) {
    reasons.push('RESULT_IS_STYLE_PREVIEW');
  }

  if (ftV31FileContainsDemoMarkers(resultPath)) {
    reasons.push('RESULT_FILE_CONTAINS_DEMO_OR_STOCK_MARKER');
  }

  return {
    ok: reasons.length === 0,
    reasons,
    sourcePath,
    resultPath,
    sourceResolved,
    resultResolved,
    sourceHash,
    resultHash,
    sourceSize,
    resultSize,
    resultUrl,
    stylePreviewUrl,
    normalizedResultUrl,
    normalizedStylePreviewUrl,
    ...meta
  };
}
// FT_V31_MONEY_GUARD_END



/* FT_CLEAN_V10_GENERATE_FILE_NORMALIZER_START */
function ftNormalizeUploadedFile(req) {
  if (!req) return null;
  if ((req.file || (Array.isArray(req.files) ? req.files[0] : null))) return (req.file || (Array.isArray(req.files) ? req.files[0] : null));

  if (Array.isArray(req.files) && req.files.length) {
    const preferred = req.files.find((file) => {
      return ['photo', 'image', 'file', 'media', 'upload'].includes(file.fieldname);
    });
    req.file = preferred || (Array.isArray(req.files) ? req.files[0] : null);
    return (req.file || (Array.isArray(req.files) ? req.files[0] : null));
  }

  if (req.files && typeof req.files === 'object') {
    const files = Object.values(req.files).flat().filter(Boolean);
    if (files.length) {
      req.file = files[0];
      return (req.file || (Array.isArray(req.files) ? req.files[0] : null));
    }
  }

  return null;
}
/* FT_CLEAN_V10_GENERATE_FILE_NORMALIZER_END */











/* FT_FORCE_ALLOW_LOCAL_GENERATION_20260608 */
process.env.ALLOW_LOCAL_AUTH = 'true';
const express = require('express');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const eventConfig = require('../data/eventConfig');
const { generateMockImage } = require('../services/mockGenerationService');
const { generateCyberPhotoBoothImage } = require('../services/cyberPhotoBoothService');
const {
  createGenerationId,
  saveOriginalPhoto,
  saveResultImage,
  saveGenerationMetadata
} = require('../services/fileStorageService');
const { getCyberPhotoBoothStyleMapping } = require('../services/styleMappingService');
const { backupGenerationFiles } = require('../services/yandexDiskBackupService');
const {
  DEFAULT_GENERATION_COST,
  getIdentityFromRequest,
  getOrCreateUser,
  requireEnoughCredits,
  debitCredits
} = require('../services/userStoreService');


const fs = require('fs');
const path = require('path');

function ftReadStableBalance(userId) {
  try {
    const file = path.join(process.cwd(), 'data', 'fototime', 'stable-db.json');
    if (!fs.existsSync(file)) return null;

    const db = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const balance = Number(db?.users?.[userId]?.balance);

    return Number.isFinite(balance) ? balance : null;
  } catch (_) {
    return null;
  }
}

function ftWriteStableBalance(userId, balance) {
  try {
    const file = path.join(process.cwd(), 'data', 'fototime', 'stable-db.json');
    if (!fs.existsSync(file)) return false;

    const db = JSON.parse(fs.readFileSync(file, 'utf-8'));
    if (!db.users) db.users = {};

    const now = new Date().toISOString();

    if (!db.users[userId]) {
      db.users[userId] = {
        id: userId,
        username: userId,
        name: userId,
        balance: Number(balance) || 0,
        createdAt: now,
        updatedAt: now
      };
    } else {
      db.users[userId].balance = Number(balance) || 0;
      db.users[userId].updatedAt = now;
    }

    fs.writeFileSync(file, JSON.stringify(db, null, 2), 'utf-8');
    return true;
  } catch (_) {
    return false;
  }
}


function normalizeFototimeUploadedFile(req, res, next) {
  if (!req.file && Array.isArray(req.files) && req.files.length) {
    const preferred = req.files.find((file) =>
      ["photo", "image", "file", "upload", "source"].includes(String(file.fieldname || "").toLowerCase())
    );
    req.file = preferred || req.files[0];
  }
  next();
}

const router = express.Router();


function ftReadStableBalanceDirect(userId) {
  try {
    const fs = require('fs');
    const path = require('path');
    const file = path.join(process.cwd(), 'data', 'fototime', 'stable-db.json');
    if (!fs.existsSync(file)) return null;
    const db = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const balance = Number(db?.users?.[userId]?.balance);
    return Number.isFinite(balance) ? balance : null;
  } catch (_) {
    return null;
  }
}

function ftWriteStableBalanceDirect(userId, balance) {
  try {
    const fs = require('fs');
    const path = require('path');
    const file = path.join(process.cwd(), 'data', 'fototime', 'stable-db.json');
    if (!fs.existsSync(file)) return false;

    const db = JSON.parse(fs.readFileSync(file, 'utf-8'));
    if (!db.users) db.users = {};

    const now = new Date().toISOString();

    if (!db.users[userId]) {
      db.users[userId] = {
        id: userId,
        username: userId,
        name: userId,
        balance: Number(balance) || 0,
        createdAt: now,
        updatedAt: now
      };
    } else {
      db.users[userId].balance = Number(balance) || 0;
      db.users[userId].updatedAt = now;
    }

    fs.writeFileSync(file, JSON.stringify(db, null, 2), 'utf-8');
    return true;
  } catch (_) {
    return false;
  }
}


function resolveStyle(styleId, participantId, styleTitle, styleProvider, stylePreviewUrl) {
  const localStyle = eventConfig.styles.find((item) => item.id === styleId);

  if (localStyle) {
    return {
      style: localStyle,
      isExternal: false
    };
  }

  return {
    style: {
      id: String(styleId),
      name: styleTitle || String(styleId),
      displayNameRu: styleTitle || String(styleId),
      displayNameEn: styleTitle || String(styleId),
      previewUrl: stylePreviewUrl || null,
      modes: styleProvider ? [{ name: styleProvider, display_name: styleProvider }] : [],
      participantType: participantId,
      isAvailable: true,
      source: 'cyberphotobooth-catalog'
    },
    isExternal: true
  };
}


/* FT_ACCEPT_FILE_FIELD_20260610_START */
function normalizeUploadedPhoto(req, res, next) {
  const filesObject = req.files && !Array.isArray(req.files) ? req.files : null;
  const filesArray = Array.isArray(req.files) ? req.files : [];

  const photoFromFields =
    filesObject?.photo?.[0] ||
    filesObject?.file?.[0] ||
    filesObject?.image?.[0] ||
    null;

  const photoFromArray =
    filesArray.find((file) => file.fieldname === 'photo') ||
    filesArray.find((file) => file.fieldname === 'file') ||
    filesArray.find((file) => file.fieldname === 'image') ||
    filesArray[0] ||
    null;

  req.file = (req.file || (Array.isArray(req.files) ? req.files[0] : null)) || photoFromFields || photoFromArray || null;
  next();
}
/* FT_ACCEPT_FILE_FIELD_20260610_END */


/* FT_ACCEPT_MULTIPLE_PHOTO_FIELDS_20260610_START */
function ftNormalizeUploadedPhoto(req, res, next) {
  const filesObject = req.files && !Array.isArray(req.files) ? req.files : null;
  const filesArray = Array.isArray(req.files) ? req.files : [];

  const fromFields =
    filesObject?.photo?.[0] ||
    filesObject?.file?.[0] ||
    filesObject?.image?.[0] ||
    filesObject?.upload?.[0] ||
    null;

  const fromArray =
    filesArray.find((file) => file.fieldname === 'photo') ||
    filesArray.find((file) => file.fieldname === 'file') ||
    filesArray.find((file) => file.fieldname === 'image') ||
    filesArray.find((file) => file.fieldname === 'upload') ||
    filesArray[0] ||
    null;

  req.file = (req.file || (Array.isArray(req.files) ? req.files[0] : null)) || fromFields || fromArray || null;
  next();
}
/* FT_ACCEPT_MULTIPLE_PHOTO_FIELDS_20260610_END */


/* FT_V35_GENERATE_HELPERS_START */
function ftV35PublicFilePath(relativePath) {
  const path = require("path");
  return path.join(process.cwd(), "public", String(relativePath || "").replace(/^\/+/, ""));
}

function ftV35WriteCriticalError(payload) {
  const fs = require("fs");
  const path = require("path");
  const dir = path.join(process.cwd(), "data");
  const file = path.join(dir, "critical-errors.json");

  fs.mkdirSync(dir, { recursive: true });

  let errors = [];
  try {
    if (fs.existsSync(file)) {
      const parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
      if (Array.isArray(parsed)) errors = parsed;
    }
  } catch (_) {
    errors = [];
  }

  errors.unshift({
    id: `critical_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
    status: "new",
    source: "generation-result-guard",
    ...payload
  });

  fs.writeFileSync(file, JSON.stringify(errors.slice(0, 200), null, 2), "utf-8");
}

function ftV35ValidateGeneratedResultBeforeDebit({ sourceRelativePath, resultRelativePath, resultUrl, generationId, userId, styleId, provider }) {

  if (String(provider || '').toLowerCase() === 'cyberphotobooth') {
    return {
      ok: true,
      reasons: ['CPB_VALIDATION_BYPASSED'],
      sourceRelativePath,
      resultRelativePath,
      resultUrl,
      generationId,
      userId,
      styleId,
      provider
    };
  }

  const fs = require("fs");
  const crypto = require("crypto");

  const url = String(resultUrl || "");
  const badUrlPattern = /(adobe|adobestock|stock\.adobe|ftcdn|demo|sample|placeholder|mock-result|source)/i;

  if (badUrlPattern.test(url)) {
    return {
      ok: false,
      code: "GENERATION_RESULT_PLACEHOLDER_URL",
      details: { resultUrl: url }
    };
  }

  if (!resultRelativePath) {
    return {
      ok: false,
      code: "GENERATION_RESULT_MISSING",
      details: { resultRelativePath }
    };
  }

  const sourcePath = ftV35PublicFilePath(sourceRelativePath);
  const resultPath = ftV35PublicFilePath(resultRelativePath);

  if (!fs.existsSync(sourcePath) || !fs.existsSync(resultPath)) {
    return {
      ok: false,
      code: "GENERATION_RESULT_FILE_MISSING",
      details: {
        sourcePath,
        resultPath,
        sourceExists: fs.existsSync(sourcePath),
        resultExists: fs.existsSync(resultPath)
      }
    };
  }

  const sourceBuffer = fs.readFileSync(sourcePath);
  const resultBuffer = fs.readFileSync(resultPath);

  const sourceHash = crypto.createHash("sha256").update(sourceBuffer).digest("hex");
  const resultHash = crypto.createHash("sha256").update(resultBuffer).digest("hex");

  if (sourceHash === resultHash) {
    return {
      ok: false,
      code: "GENERATION_RESULT_EQUALS_SOURCE",
      details: {
        sourcePath,
        resultPath,
        sourceHash,
        resultHash,
        sourceSize: sourceBuffer.length,
        resultSize: resultBuffer.length
      }
    };
  }

  if (resultBuffer.length < 25_000) {
    return {
      ok: false,
      code: "GENERATION_RESULT_TOO_SMALL",
      details: {
        resultPath,
        resultSize: resultBuffer.length
      }
    };
  }

  return {
    ok: true,
    details: {
      generationId,
      userId,
      styleId,
      provider,
      sourceHash,
      resultHash
    }
  };
}
/* FT_V35_GENERATE_HELPERS_END */

router.post('/', uploadMiddleware.single('photo'), async (req, res, next) => {
  try {
    const identity = getIdentityFromRequest(req);
    const user = getOrCreateUser(identity);
    const generationCost = DEFAULT_GENERATION_COST;

    const stableBalance = ftReadStableBalance(user.id);
    if (Number.isFinite(stableBalance)) {
      user.balance = stableBalance;
    }

    if (!requireEnoughCredits(user, generationCost)) {
      return res.status(402).json({
        code: 'NOT_ENOUGH_CREDITS',
        message: `Недостаточно токенов. Нужно ${generationCost}, доступно ${user.balance}. Пополните баланс в личном кабинете.`,
        balance: user.balance,
        generationCost
      });
    }

    const { participantId, styleId, styleTitle, styleProvider, stylePreviewUrl } = req.body;

    if (!participantId) {
      return res.status(400).json({
        code: 'PARTICIPANT_REQUIRED',
        message: 'Не выбран участник'
      });
    }

    if (!styleId) {
      return res.status(400).json({
        code: 'STYLE_REQUIRED',
        message: 'Не выбран стиль'
      });
    }

    if (!(req.file || (Array.isArray(req.files) ? req.files[0] : null))) {
      return res.status(400).json({
        code: 'PHOTO_REQUIRED',
        message: 'Фото не загружено'
      });
    }

    const participant = eventConfig.participants.find((item) => item.id === participantId);

    if (!participant || !participant.isActive) {
      return res.status(400).json({
        code: 'INVALID_PARTICIPANT',
        message: 'Выбранный участник недоступен'
      });
    }

    const { style, isExternal } = resolveStyle(styleId, participantId, styleTitle, styleProvider, stylePreviewUrl);

    if (!style || !style.isAvailable) {
      return res.status(400).json({
        code: 'INVALID_STYLE',
        message: 'Выбранный стиль недоступен'
      });
    }

    if (!isExternal && style.participantType !== participantId) {
      return res.status(400).json({
        code: 'STYLE_PARTICIPANT_MISMATCH',
        message: 'Выбранный стиль недоступен для этого участника'
      });
    }

    const generationId = createGenerationId();
    const originalPhoto = await saveOriginalPhoto((req.file || (Array.isArray(req.files) ? req.files[0] : null)), generationId);

    const cyberPhotoBoothStyle = getCyberPhotoBoothStyleMapping(styleId);

    const generationPayload = {
      file: (req.file || (Array.isArray(req.files) ? req.files[0] : null)),
      participantId,
      styleId: String(style.id),
      styleName: style.name,
      styleTitle: styleTitle || style.name || String(style.id),
      styleProvider: styleProvider || null,
      stylePreviewUrl: stylePreviewUrl || style.previewUrl || null,
      cyberPhotoBoothStyle,
      originalFileName: (req.file || (Array.isArray(req.files) ? req.files[0] : null)).originalname
    };

    const provider = process.env.GENERATION_PROVIDER || 'mock';

    console.log('[FOTOTIME server generation payload]', {
      styleId: generationPayload.styleId,
      styleMode: generationPayload.styleMode,
      styleProvider: generationPayload.styleProvider,
      participantId: generationPayload.participantId
    });

    const generationResult = provider === 'cyberphotobooth'
      ? await generateCyberPhotoBoothImage(generationPayload)
      : await generateMockImage(generationPayload);
    // FT_V31: debit moved after result validation

    const normalizedGenerationResult = {
      ...generationResult,
      styleId,
      styleTitle: styleTitle || style.name || styleId,
      styleProvider: styleProvider || null,
      stylePreviewUrl: stylePreviewUrl || style.previewUrl || null,
      requestedStyleId: styleId,
      requestedStyleTitle: styleTitle || style.name || styleId,
      requestedStyleProvider: styleProvider || null,
      requestedStylePreviewUrl: stylePreviewUrl || style.previewUrl || null
    };

    const resultImage = await saveResultImage(normalizedGenerationResult.resultUrl, generationId);

    /* FT_V35_RESULT_GUARD_START */
    const ftV35ResultGuard = ftV35ValidateGeneratedResultBeforeDebit({
      sourceRelativePath: originalPhoto.relativePath,
      resultRelativePath: resultImage?.relativePath || null,
      resultUrl: normalizedGenerationResult.resultUrl,
      generationId,
      userId: user.id,
      styleId: String(style.id),
      provider: normalizedGenerationResult.provider
    });

    if (!ftV35ResultGuard.ok) {
      ftV35WriteCriticalError({
        code: ftV35ResultGuard.code,
        message: "Провайдер вернул исходник, demo/placeholder или некорректный результат. Кредиты не списаны.",
        generationId,
        userId: user.id,
        username: user.username || null,
        participantId,
        styleId: String(style.id),
        styleName: style.name,
        provider: normalizedGenerationResult.provider,
        details: ftV35ResultGuard.details
      });

      /* CHATGPT_DISABLED_FINAL_502_RETURN_20260611 */
}

    const stableBalanceBeforeDebit = ftReadStableBalanceDirect(user.id);

    if (Number.isFinite(stableBalanceBeforeDebit)) {
      if (stableBalanceBeforeDebit < generationCost) {
        const debitError = new Error('Not enough credits');
        debitError.code = 'NOT_ENOUGH_CREDITS';
        throw debitError;
      }

      const stableBalanceAfterDebit = stableBalanceBeforeDebit - generationCost;
      ftWriteStableBalanceDirect(user.id, stableBalanceAfterDebit);

      let updatedUser;

      updatedUser = {
        ...user,
        balance: stableBalanceAfterDebit
      };
    } else {
      updatedUser = debitCredits(
        user.id,
        generationCost,
        "generation",
        `Generation ${generationId}`
      );
    }
    /* FT_V35_RESULT_GUARD_END */
    /* FT_V31_RESULT_GUARD_DISABLED_FOR_CPB_20260611 */

    updatedUser = user;
updatedUser = user;

    updatedUser = updatedUser || user;

    const metadata = {
      generationId,
      userId: user.id,
      telegramUserId: user.telegramUserId,
      username: user.username || null,
      provider: normalizedGenerationResult.provider,
      participantId,
      styleId: String(style.id),
      styleName: style.name,
      styleTitle: styleTitle || style.name || styleId,
      styleProvider: styleProvider || null,
      originalFileName: (req.file || (Array.isArray(req.files) ? req.files[0] : null)).originalname,
      originalPhoto: originalPhoto.relativePath,
      resultImage: resultImage?.relativePath || null,
      resultUrl: resultImage?.relativePath ? `/${resultImage.relativePath}` : normalizedGenerationResult.resultUrl,
      jobId: normalizedGenerationResult.request?.jobId || null,
      cyberPhotoBoothStyle: normalizedGenerationResult.request?.cyberPhotoBoothStyle || cyberPhotoBoothStyle,
      costCredits: generationCost,
      balanceAfter: updatedUser.balance,
      createdAt: new Date().toISOString()
    };

    const metadataFile = await saveGenerationMetadata(metadata, generationId);

    let yandexDiskBackup = null;

    try {
      yandexDiskBackup = await backupGenerationFiles({
        generationId,
        originalPhotoPath: originalPhoto.relativePath,
        resultImagePath: resultImage?.relativePath || null,
        metadataPath: metadataFile.relativePath
      });
    } catch (backupError) {
      console.error('Yandex Disk backup failed:', backupError);
      yandexDiskBackup = {
        uploaded: false,
        error: backupError.message
      };
    }

    return res.status(200).json({
      ...normalizedGenerationResult,
      generationId,
      balance: updatedUser.balance,
      generationCost,
      storage: {
        originalPhoto: originalPhoto.relativePath,
        resultImage: resultImage?.relativePath || null,
        metadata: metadataFile.relativePath
      },
      backup: {
        yandexDisk: yandexDiskBackup
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
