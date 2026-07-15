'use strict';

const crypto = require('crypto');
const express = require('express');

const router = express.Router();
const WINDOW_MS = 15 * 60 * 1_000;
const MAX_FAILURES = 5;
const attempts = new Map();

function configuredPins() {
  return String(process.env.ADMIN_PIN || '')
    .split(',')
    .map((pin) => pin.trim())
    .filter(Boolean);
}

function equalSecret(left, right) {
  const leftDigest = crypto.createHash('sha256').update(String(left)).digest();
  const rightDigest = crypto.createHash('sha256').update(String(right)).digest();
  return crypto.timingSafeEqual(leftDigest, rightDigest);
}

function clientKey(req) {
  return String(req.ip || req.socket?.remoteAddress || 'unknown');
}

function activeAttempt(key) {
  const attempt = attempts.get(key);
  if (!attempt || Date.now() - attempt.startedAt > WINDOW_MS) {
    const next = { failures: 0, startedAt: Date.now() };
    attempts.set(key, next);
    return next;
  }
  return attempt;
}

router.post('/verify', (req, res) => {
  const key = clientKey(req);
  const attempt = activeAttempt(key);
  if (attempt.failures >= MAX_FAILURES) {
    return res.status(429).json({ ok: false, message: 'Too many attempts. Try again later.' });
  }

  const pins = configuredPins();
  if (!pins.length) {
    return res.status(503).json({ ok: false, message: 'Admin access is not configured.' });
  }

  const provided = String(req.body?.pin || '').trim();
  const valid = provided && pins.some((pin) => equalSecret(provided, pin));
  if (!valid) {
    attempt.failures += 1;
    return res.status(403).json({ ok: false, message: 'Invalid admin PIN.' });
  }

  attempts.delete(key);
  return res.json({ ok: true });
});

module.exports = router;
