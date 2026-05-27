const express = require('express');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const eventConfig = require('../data/eventConfig');

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

    res.status(200).json({
      status: 'success',
      message: 'Изображение успешно сгенерировано',
      resultUrl: '/assets/mock-result.svg',
      request: {
        eventId: eventConfig.eventId,
        participantId,
        styleId,
        originalFileName: req.file.originalname
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
