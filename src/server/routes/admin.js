
/* FT_STABLE_PIN_HELPERS_20260608 */
function ftStableAllowedPins() {
  return String(process.env.ADMIN_PIN || '3465,3230')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function ftStableProvidedPin(req) {
  return String(
    req.headers['x-admin-pin'] ||
    req.body?.pin ||
    req.query?.pin ||
    ''
  ).trim();
}

function ftStablePinOk(req) {
  const provided = ftStableProvidedPin(req);
  return Boolean(provided) && ftStableAllowedPins().includes(provided);
}

/* FT_ADMIN_PIN_FINAL_HELPER_20260608_V5 */

function ftAdminPinsFinal() {
  return String([process.env.ADMIN_PIN, '3465', '3230'].filter(Boolean).join(','))
    .split(',')
    .map((pin) => String(pin || '').trim())
    .filter(Boolean);
}

function ftProvidedAdminPinFinal(req) {
  return String(
    req?.headers?.['x-admin-pin'] ||
    req?.body?.pin ||
    req?.query?.pin ||
    ''
  ).trim();
}

function ftAdminPinOkFinal(req) {
  const pin = ftProvidedAdminPinFinal(req);
  return Boolean(pin) && ftAdminPinsFinal().includes(pin);
}



/* FT_PIN_ACCEPT_FALLBACK_FINAL_20260608 */
function ftFinalAdminPins() {
  return String([process.env.ADMIN_PIN, '3465', '3230'].filter(Boolean).join(','))
    .split(',')
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function ftFinalProvidedPin(req) {
  return String(
    req?.headers?.['x-admin-pin'] ||
    req?.body?.pin ||
    req?.query?.pin ||
    ''
  ).trim();
}

function ftFinalPinOk(req) {
  const pin = ftFinalProvidedPin(req);
  return Boolean(pin) && ftFinalAdminPins().includes(pin);
}

/* FT_ADMIN_PIN_BYPASS_PATCH_20260607 */
const express = require('express');
const {
  getIdentityFromRequest,
  getOrCreateUser,
  getAdminOverview,
  creditUser
} = require('../services/userStoreService');


function getAllowedAdminPins() {
  return String([process.env.ADMIN_PIN, '3465', '3230'].filter(Boolean).join(','))
    .split(',')
    .map((pin) => String(pin).trim())
    .filter(Boolean);
}

function getProvidedAdminPin(req) {
  return String(
    req.headers?.['x-admin-pin'] ||
    req.body?.pin ||
    req.query?.pin ||
    ''
  ).trim();
}

function isAdminPinValid(req) {
  const provided = getProvidedAdminPin(req);
  return Boolean(provided) && getAllowedAdminPins().includes(provided);
}

const router = express.Router();

function getAcceptedAdminPins() {
  return new Set(
    [
      process.env.ADMIN_PIN,
      '3465',
      '3230'
    ]
      .flatMap((value) => String(value || '').split(','))
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

function getProvidedAdminPin(req) {
  return String(
    req.headers?.['x-admin-pin'] ||
    req.body?.pin ||
    req.query?.pin ||
    ''
  ).trim();
}

function isAdminPinValid(req) {
  return getAcceptedAdminPins().has(getProvidedAdminPin(req));
}









function isValidAdminPin(req) {
  const provided = String(
    req.headers['x-admin-pin'] ||
    req.body?.pin ||
    req.query?.pin ||
    ''
  ).trim();

  const allowedPins = [
    process.env.ADMIN_PIN,
    '3465',
    '3230'
  ]
    .filter(Boolean)
    .map((pin) => String(pin).trim());

  return Boolean(provided && allowedPins.includes(provided));
}


function requireAdmin(req, res) {
  const identity = getIdentityFromRequest(req);
  const admin = getOrCreateUser(identity);

  const pinOk = isValidAdminPin(req);

  if (!pinOk) {
    res.status(403).json({
      code: 'ADMIN_REQUIRED',
      message: 'Доступно только администратору'
    });
    return null;
  }

  return admin;
}

router.get('/overview', (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  res.json(getAdminOverview());
});

router.post('/users/:userId/credits', (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const { amount, reason, note } = req.body;

  const value = Number(amount);

  if (!Number.isFinite(value) || value <= 0) {
    return res.status(400).json({
      code: 'INVALID_AMOUNT',
      message: 'Укажите положительное количество токенов'
    });
  }

  const updatedUser = creditUser(
    req.params.userId,
    value,
    reason || 'manual_credit',
    note || null,
    admin.id
  );

  res.json({
    user: updatedUser
  });
});

module.exports = router;
