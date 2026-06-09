const express = require('express');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const url = String(req.query.url || '');

    if (!/^https?:\/\//i.test(url)) {
      return res.status(400).send('Invalid image url');
    }

    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).send('Image load failed');
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await response.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (error) {
    res.status(500).send('Image proxy error');
  }
});

module.exports = router;
