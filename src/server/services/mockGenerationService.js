const eventConfig = require('../data/eventConfig');

async function generateMockImage({ participantId, styleId, originalFileName }) {
  return {
    status: 'success',
    message: 'Изображение успешно сгенерировано',
    resultUrl: '/assets/mock-result.svg',
    provider: 'mock',
    request: {
      eventId: eventConfig.eventId,
      participantId,
      styleId,
      originalFileName
    }
  };
}

module.exports = {
  generateMockImage
};
