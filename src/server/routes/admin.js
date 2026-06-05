const express = require('express');
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

  if (!admin.isAdmin) {
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
