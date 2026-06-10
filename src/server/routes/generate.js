
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

router.post('/', uploadMiddleware.single('photo'), async (req, res, next) => {
  try {
    const identity = getIdentityFromRequest(req);
    const user = getOrCreateUser(identity);
    const generationCost = DEFAULT_GENERATION_COST;

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

    const updatedUser = debitCredits(
      user.id,
      generationCost,
      'generation',
      `Generation ${generationId}`
    );

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
