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

    if (!req.file) {
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
    const originalPhoto = await saveOriginalPhoto(req.file, generationId);

    const cyberPhotoBoothStyle = getCyberPhotoBoothStyleMapping(styleId);

    const generationPayload = {
      file: req.file,
      participantId,
      styleId: String(style.id),
      styleName: style.name,
      styleTitle: styleTitle || style.name || String(style.id),
      styleProvider: styleProvider || null,
      stylePreviewUrl: stylePreviewUrl || style.previewUrl || null,
      cyberPhotoBoothStyle,
      originalFileName: req.file.originalname
    };

    const provider = process.env.GENERATION_PROVIDER || 'mock';

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
      originalFileName: req.file.originalname,
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
