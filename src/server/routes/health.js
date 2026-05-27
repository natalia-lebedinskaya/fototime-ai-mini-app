const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'fototime-ai-mini-app'
  });
});

module.exports = router;
