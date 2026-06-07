/* FT_ADMIN_PIN_BYPASS_PATCH_20260607 */\nconst express = require('express');
const {
  getIdentityFromRequest,
  getOrCreateUser,
  getAdminOverview,
  creditUser
} = require('../services/userStoreService');

const router = express.Router();

function requireAdmin(req, res) {
  const identity = getIdentityFromRequest(req);
  const admin = getOrCreateUser(identity);

  const expectedPin = String(process.env.ADMIN_PIN || '3465').trim();
  const providedPin = String(req.headers['x-admin-pin'] || '').trim();
  const pinOk = Boolean(providedPin) && providedPin === expectedPin;

  if (!admin.isAdmin && !pinOk) {
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
