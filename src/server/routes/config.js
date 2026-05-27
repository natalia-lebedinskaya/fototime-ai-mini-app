const express = require('express');
const eventConfig = require('../data/eventConfig');

const router = express.Router();

router.get('/', (req, res) => {
  if (!eventConfig || eventConfig.status !== 'active') {
    return res.status(404).json({
      code: 'EVENT_NOT_AVAILABLE',
      message: 'Мероприятие недоступно'
    });
  }

  res.status(200).json(eventConfig);
});

module.exports = router;
