/* FT_LOCAL_DEMO_ADMIN_PATCH_20260607 */
/* FT_LOCAL_AUTH_DIRECT_PATCH_20260607 */
const fs = require('fs');
const path = require('path');
const { getTelegramIdentity } = require('./telegramAuthService');

const DATA_DIR = path.join(process.cwd(), 'storage', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');

const WELCOME_BONUS = 50;
const DEFAULT_GENERATION_COST = 40;

function ensureDataFiles() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2));
  }

  if (!fs.existsSync(TRANSACTIONS_FILE)) {
    fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify({ transactions: [] }, null, 2));
  }
}

function readJson(filePath, fallback) {
  ensureDataFiles();

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  ensureDataFiles();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function normalizeUserId(value) {
  return String(value || '').trim();
}

function getAdminIds() {
  return String(process.env.ADMIN_TELEGRAM_IDS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function ftAllowLocalAuth() {
  return String(process.env.ALLOW_LOCAL_AUTH || '').toLowerCase() === 'true';
}

function ftLocalIdentityFromRequest(req) {
  const userId = req?.headers?.['x-user-id']
    || req?.headers?.['x-telegram-user-id']
    || req?.body?.userId
    || req?.body?.telegramUserId
    || req?.query?.userId;

  if (!ftAllowLocalAuth()) return null;
  if (!userId) return null;

  return String(userId);
}

/* FT_LOCAL_AUTH_PATCH_20260607 */
function isAdminUser(userId) {
  if (
    String(process.env.ALLOW_LOCAL_AUTH || '').toLowerCase() === 'true' &&
    String(userId) === 'local-demo-user'
  ) {
    return true;
  }

  return getAdminIds().includes(String(userId));
  if (ftAllowLocalAuth() && String(userId) === 'local-demo-user') {
    return true;
  }
}

function getIdentityFromRequest(req) {
  const identity = getTelegramIdentity(req);

  if (!identity) {
    const localIdentity = ftLocalIdentityFromRequest(req);
    if (localIdentity) {
      return localIdentity;
    }

    const allowLocalAuth = String(process.env.ALLOW_LOCAL_AUTH || '').toLowerCase() === 'true';
    const localUserId =
      req?.headers?.['x-user-id'] ||
      req?.headers?.['x-telegram-user-id'] ||
      req?.body?.userId ||
      req?.body?.telegramUserId ||
      req?.query?.userId;

    if (allowLocalAuth && localUserId) {
      return String(localUserId);
    }

    const error = new Error('Telegram authorization required');
    error.code = 'TELEGRAM_AUTH_REQUIRED';
    throw error;
  }

  return identity;
}

function getUsersStore() {
  return readJson(USERS_FILE, { users: [] });
}

function saveUsersStore(store) {
  writeJson(USERS_FILE, store);
}

function getTransactionsStore() {
  return readJson(TRANSACTIONS_FILE, { transactions: [] });
}

function saveTransactionsStore(store) {
  writeJson(TRANSACTIONS_FILE, store);
}

function createTransaction({ userId, amount, type, reason, note, createdBy }) {
  const store = getTransactionsStore();

  const transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    userId: String(userId),
    amount: Number(amount),
    type,
    reason: reason || null,
    note: note || null,
    createdBy: createdBy || 'system',
    createdAt: new Date().toISOString()
  };

  store.transactions.unshift(transaction);
  saveTransactionsStore(store);

  return transaction;
}

function getOrCreateUser(identity) {
  const store = getUsersStore();
  const userId = normalizeUserId(identity.telegramUserId || 'local-demo-user');

  let user = store.users.find((item) => String(item.id) === String(userId));

  if (!user) {
    user = {
      id: userId,
      telegramUserId: userId,
      username: identity.username || null,
      firstName: identity.firstName || null,
      lastName: identity.lastName || null,
      balance: WELCOME_BONUS,
      welcomeBonusGranted: true,
      generationsCount: 0,
      spentCredits: 0,
      isAdmin: isAdminUser(userId),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store.users.unshift(user);
    saveUsersStore(store);

    createTransaction({
      userId,
      amount: WELCOME_BONUS,
      type: 'credit',
      reason: 'welcome_bonus',
      note: 'Welcome bonus for first Telegram authorization',
      createdBy: 'system'
    });

    return user;
  }

  user.username = identity.username || user.username || null;
  user.firstName = identity.firstName || user.firstName || null;
  user.lastName = identity.lastName || user.lastName || null;
  user.isAdmin = isAdminUser(userId);
  user.updatedAt = new Date().toISOString();

  saveUsersStore(store);

  return user;
}

function getUserById(userId) {
  const store = getUsersStore();
  return store.users.find((item) => String(item.id) === String(userId)) || null;
}

function requireEnoughCredits(user, cost = DEFAULT_GENERATION_COST) {
  return Number(user.balance || 0) >= Number(cost);
}

function debitCredits(userId, amount, reason, note) {
  const store = getUsersStore();
  const user = store.users.find((item) => String(item.id) === String(userId));

  if (!user) {
    throw new Error('User not found');
  }

  const value = Number(amount);

  if (Number(user.balance || 0) < value) {
    const error = new Error('Not enough credits');
    error.code = 'NOT_ENOUGH_CREDITS';
    throw error;
  }

  user.balance = Number(user.balance || 0) - value;
  user.spentCredits = Number(user.spentCredits || 0) + value;
  user.generationsCount = Number(user.generationsCount || 0) + 1;
  user.updatedAt = new Date().toISOString();

  saveUsersStore(store);

  createTransaction({
    userId,
    amount: -value,
    type: 'debit',
    reason,
    note,
    createdBy: 'system'
  });

  return user;
}

function creditUser(userId, amount, reason, note, createdBy) {
  const store = getUsersStore();
  const user = store.users.find((item) => String(item.id) === String(userId));

  if (!user) {
    throw new Error('User not found');
  }

  const value = Number(amount);

  user.balance = Number(user.balance || 0) + value;
  user.updatedAt = new Date().toISOString();

  saveUsersStore(store);

  createTransaction({
    userId,
    amount: value,
    type: 'credit',
    reason,
    note,
    createdBy
  });

  return user;
}

function getTransactionsByUser(userId) {
  const store = getTransactionsStore();

  return store.transactions.filter((item) => String(item.userId) === String(userId));
}

function getAdminOverview() {
  const usersStore = getUsersStore();
  const transactionsStore = getTransactionsStore();

  const users = usersStore.users.map((user) => ({
    ...user,
    transactions: transactionsStore.transactions
      .filter((item) => String(item.userId) === String(user.id))
      .slice(0, 10)
  }));

  const totalUsers = users.length;
  const totalGenerations = users.reduce((sum, user) => sum + Number(user.generationsCount || 0), 0);
  const totalSpentCredits = users.reduce((sum, user) => sum + Number(user.spentCredits || 0), 0);

  return {
    users,
    stats: {
      totalUsers,
      totalGenerations,
      totalSpentCredits
    }
  };
}

module.exports = {
  WELCOME_BONUS,
  DEFAULT_GENERATION_COST,
  getIdentityFromRequest,
  getOrCreateUser,
  getUserById,
  requireEnoughCredits,
  debitCredits,
  creditUser,
  getTransactionsByUser,
  getAdminOverview,
  isAdminUser
};
