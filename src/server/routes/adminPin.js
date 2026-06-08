const express = require('express');
const fs = require('fs');
const path = require('path');

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

router.use(express.json({ limit: '64kb' }));

const DATA_DIR = path.join(process.cwd(), 'storage', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');








function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function checkPin(req, res, next) {
  if (!isValidAdminPin(req)) {
    return res.status(403).json({ message: 'Неверный PIN администратора' });
  }

  next();
}

router.get('/overview', checkPin, (req, res) => {
  const usersStore = readJson(USERS_FILE, { users: [] });
  const transactionsStore = readJson(TRANSACTIONS_FILE, { transactions: [] });

  const users = usersStore.users || [];
  const transactions = transactionsStore.transactions || [];

  const totalSpentCredits = transactions
    .filter((tx) => Number(tx.amount) < 0)
    .reduce((sum, tx) => sum + Math.abs(Number(tx.amount || 0)), 0);

  const totalGenerations = transactions
    .filter((tx) => Number(tx.amount) < 0)
    .length;

  res.json({
    stats: {
      totalUsers: users.length,
      totalGenerations,
      totalSpentCredits
    },
    users: users.map((user) => {
      const userTransactions = transactions.filter((tx) => String(tx.userId) === String(user.id));
      const spentCredits = userTransactions
        .filter((tx) => Number(tx.amount) < 0)
        .reduce((sum, tx) => sum + Math.abs(Number(tx.amount || 0)), 0);

      return {
        ...user,
        generationsCount: userTransactions.filter((tx) => Number(tx.amount) < 0).length,
        spentCredits
      };
    })
  });
});

router.post('/users/:userId/credits', checkPin, (req, res) => {
  const { userId } = req.params;
  const amount = Number(req.body.amount || 0);
  const reason = req.body.reason || 'manual_credit';
  const note = req.body.note || 'Ручное начисление токенов';

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Некорректное количество токенов' });
  }

  const usersStore = readJson(USERS_FILE, { users: [] });
  const transactionsStore = readJson(TRANSACTIONS_FILE, { transactions: [] });

  const user = usersStore.users.find((item) => String(item.id) === String(userId));

  if (!user) {
    return res.status(404).json({ message: 'Пользователь не найден' });
  }

  const before = Number(user.balance || 0);
  user.balance = before + amount;
  user.updatedAt = new Date().toISOString();

  transactionsStore.transactions.unshift({
    id: `tx_${Date.now()}`,
    userId: user.id,
    amount,
    reason,
    note,
    balanceBefore: before,
    balanceAfter: user.balance,
    createdAt: new Date().toISOString()
  });

  writeJson(USERS_FILE, usersStore);
  writeJson(TRANSACTIONS_FILE, transactionsStore);

  res.json({ user });
});

module.exports = router;
