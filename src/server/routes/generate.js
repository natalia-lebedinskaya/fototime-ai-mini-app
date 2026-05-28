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

const router = express.Router();

router.post('/', uploadMiddleware.single('photo'), async (req, res, next) => {
  try {
    const { participantId, styleId } = req.body;

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
        message: 'Не загружено фото'
      });
    }

    const participant = eventConfig.participants.find((item) => item.id === participantId);
    const style = eventConfig.styles.find((item) => item.id === styleId);

    if (!participant || !participant.isActive) {
      return res.status(400).json({
        code: 'INVALID_PARTICIPANT',
        message: 'Выбранный участник недоступен'
      });
    }

    if (!style || !style.isAvailable) {
      return res.status(400).json({
        code: 'INVALID_STYLE',
        message: 'Выбранный стиль недоступен'
      });
    }

    if (style.participantType !== participantId) {
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
      styleId,
      cyberPhotoBoothStyle,
      originalFileName: req.file.originalname
    };

    const provider = process.env.GENERATION_PROVIDER || 'mock';

    const generationResult = provider === 'cyberphotobooth'
      ? await generateCyberPhotoBoothImage(generationPayload)
      : await generateMockImage(generationPayload);

    const resultImage = await saveResultImage(generationResult.resultUrl, generationId);

    const metadata = {
      generationId,
      provider: generationResult.provider,
      participantId,
      styleId,
      originalFileName: req.file.originalname,
      originalPhoto: originalPhoto.relativePath,
      resultImage: resultImage?.relativePath || null,
      jobId: generationResult.request?.jobId || null,
      cyberPhotoBoothStyle: generationResult.request?.cyberPhotoBoothStyle || null,
      createdAt: new Date().toISOString()
    };

    const metadataFile = await saveGenerationMetadata(metadata, generationId);

    return res.status(200).json({
      ...generationResult,
      generationId,
      storage: {
        originalPhoto: originalPhoto.relativePath,
        resultImage: resultImage?.relativePath || null,
        metadata: metadataFile.relativePath
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
