const crypto = require('crypto');

function parseInitData(initData) {
  const params = new URLSearchParams(initData || '');
  const hash = params.get('hash');

  if (!hash) {
    return null;
  }

  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(process.env.TELEGRAM_BOT_TOKEN || '')
    .digest();

  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (calculatedHash !== hash) {
    return null;
  }

  const userRaw = params.get('user');

  if (!userRaw) {
    return null;
  }

  try {
    const user = JSON.parse(userRaw);

    return {
      telegramUserId: String(user.id),
      username: user.username || null,
      firstName: user.first_name || null,
      lastName: user.last_name || null
    };
  } catch {
    return null;
  }
}

function getTelegramIdentity(req) {
  const initData =
    req.headers['x-telegram-init-data'] ||
    req.body?.telegramInitData ||
    req.query?.telegramInitData ||
    '';

  const verified = parseInitData(initData);

  if (verified) {
    return verified;
  }

  const allowLocal =
    process.env.ALLOW_LOCAL_AUTH === 'true' ||
    process.env.NODE_ENV !== 'production';

  if (allowLocal) {
    return {
      telegramUserId: 'local-demo-user',
      username: 'local-demo-user',
      firstName: 'Local',
      lastName: 'Demo'
    };
  }

  return null;
}

module.exports = {
  getTelegramIdentity
};
