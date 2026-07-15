const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);
const DATA_DIR = path.join(process.cwd(), 'data', 'fototime');
const DB_FILE = path.join(DATA_DIR, 'identity-db.json');
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

function now() {
  return new Date().toISOString();
}

function ensureDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify(
        {
          schemaVersion: 1,
          profiles: {},
          identityIndex: {},
          loginIndex: {},
          updatedAt: now(),
        },
        null,
        2,
      ),
    );
  }
}

function readDb() {
  ensureDb();
  try {
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return {
      schemaVersion: 1,
      profiles: db.profiles || {},
      identityIndex: db.identityIndex || {},
      loginIndex: db.loginIndex || {},
      updatedAt: db.updatedAt || now(),
    };
  } catch (_) {
    return { schemaVersion: 1, profiles: {}, identityIndex: {}, loginIndex: {}, updatedAt: now() };
  }
}

function saveDb(db) {
  db.updatedAt = now();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function clean(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function loginKey(value) {
  return clean(value).toLowerCase();
}

function sessionSecret() {
  const secret = process.env.FOTOTIME_SESSION_SECRET || process.env.TELEGRAM_BOT_TOKEN;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FOTOTIME_SESSION_SECRET is required in production');
  }
  return 'local-development-only-secret';
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function sign(value) {
  return crypto.createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

function createSession(profile) {
  const payload = { profileId: profile.id, expiresAt: Date.now() + SESSION_TTL_MS };
  const encoded = encode(payload);
  return `${encoded}.${sign(encoded)}`;
}

function readSession(token) {
  const [encoded, signature] = String(token || '').split('.');
  if (!encoded || !signature) return null;
  const actual = Buffer.from(signature);
  const expected = Buffer.from(sign(encoded));
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    return payload.expiresAt > Date.now() ? payload : null;
  } catch (_) {
    return null;
  }
}

function profilePublic(profile) {
  const telegram = profile.providers?.telegram || null;
  const password = profile.providers?.password || null;
  const browser = profile.providers?.browser || null;
  return {
    id: profile.id,
    username: profile.username || profile.displayName || `user-${profile.id.slice(-6)}`,
    name: profile.displayName || profile.username || 'FOT AI user',
    telegramId: telegram?.id || '',
    photoUrl: telegram?.photoUrl || profile.avatar?.photoUrl || '',
    avatarEmoji: profile.avatar?.emoji || '✨',
    avatarGradient: profile.avatar?.gradient || 'lime',
    authProvider: telegram ? 'telegram' : password ? 'password' : browser ? 'web' : 'guest',
    deviceName: browser?.deviceName || '',
    linkedProviders: Object.keys(profile.providers || {}),
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

function createProfile(db, seed = {}) {
  // Preserve the application's existing browser/Telegram IDs when possible.
  // This keeps balances and generation history created before identity storage.
  const requestedId = clean(seed.profileId);
  const id =
    requestedId && /^[a-z0-9_-]{3,128}$/i.test(requestedId) && !db.profiles[requestedId]
      ? requestedId
      : `profile_${crypto.randomUUID()}`;
  const profile = {
    id,
    username: clean(seed.username),
    displayName: clean(seed.name || seed.displayName),
    providers: {},
    avatar: {
      emoji: clean(seed.avatarEmoji, '✨').slice(0, 8),
      gradient: clean(seed.avatarGradient, 'lime'),
      photoUrl: '',
    },
    credentials: { passwordHash: null, passwordUpdatedAt: null },
    preferences: { language: clean(seed.language, 'ru'), theme: clean(seed.theme, 'light') },
    status: 'active',
    createdAt: now(),
    updatedAt: now(),
    lastSeenAt: now(),
  };
  db.profiles[id] = profile;
  return profile;
}

function attachBrowser(db, input = {}) {
  const deviceId = clean(input.id || input.userId);
  if (!deviceId || !/^web_[a-z0-9_-]{8,}$/i.test(deviceId))
    throw new Error('A valid browser identity is required');
  const identityKey = `browser:${deviceId}`;
  let profile = db.profiles[db.identityIndex[identityKey]];
  if (!profile) {
    profile = createProfile(db, { ...input, profileId: deviceId });
    db.identityIndex[identityKey] = profile.id;
  }
  profile.providers.browser = {
    id: deviceId,
    deviceName: clean(input.deviceName, 'browser'),
    firstSeenAt: profile.providers.browser?.firstSeenAt || now(),
    lastSeenAt: now(),
  };
  profile.avatar.emoji = clean(input.avatarEmoji, profile.avatar.emoji).slice(0, 8);
  profile.avatar.gradient = clean(input.avatarGradient, profile.avatar.gradient);
  profile.updatedAt = now();
  profile.lastSeenAt = now();
  return profile;
}

function verifyTelegramInitData(initData) {
  const params = new URLSearchParams(String(initData || ''));
  const hash = params.get('hash');
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!hash || !token) return null;
  params.delete('hash');
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
  const expected = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  if (hash.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expected)))
    return null;
  try {
    return JSON.parse(params.get('user') || '');
  } catch (_) {
    return null;
  }
}

function attachTelegram(db, telegramUser, input = {}) {
  const telegramId = String(telegramUser.id || '').trim();
  if (!telegramId) throw new Error('Telegram identity is invalid');
  const identityKey = `telegram:${telegramId}`;
  let profile = db.profiles[db.identityIndex[identityKey]];
  if (!profile) {
    profile = createProfile(db, {
      profileId: telegramId,
      username: telegramUser.username,
      name: [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' '),
    });
    db.identityIndex[identityKey] = profile.id;
  }
  profile.providers.telegram = {
    id: telegramId,
    username: clean(telegramUser.username),
    firstName: clean(telegramUser.first_name),
    lastName: clean(telegramUser.last_name),
    photoUrl: clean(telegramUser.photo_url || input.photoUrl),
    linkedAt: profile.providers.telegram?.linkedAt || now(),
    lastSyncedAt: now(),
  };
  profile.username = clean(telegramUser.username, profile.username);
  profile.displayName = clean(
    [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' '),
    profile.displayName || profile.username,
  );
  if (profile.providers.telegram.photoUrl) profile.avatar.photoUrl = profile.providers.telegram.photoUrl;
  profile.updatedAt = now();
  profile.lastSeenAt = now();
  return profile;
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const derived = await scrypt(String(password), salt, 64);
  return `scrypt$${salt}$${Buffer.from(derived).toString('base64url')}`;
}

async function verifyPassword(password, stored) {
  const [kind, salt, digest] = String(stored || '').split('$');
  if (kind !== 'scrypt' || !salt || !digest) return false;
  const derived = await scrypt(String(password), salt, 64);
  const expected = Buffer.from(digest, 'base64url');
  return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
}

async function registerLocalPasswordProfile({ login, password, displayName }) {
  const key = loginKey(login);
  if (!/^[a-z0-9._-]{3,48}$/i.test(key))
    throw new Error('Login must be 3–48 characters: letters, digits, dot, dash, or underscore');
  if (String(password || '').length < 10) throw new Error('Password must contain at least 10 characters');
  const db = readDb();
  if (db.loginIndex[key]) throw new Error('This login is already in use');
  const profile = createProfile(db, { username: key, name: displayName || key });
  profile.providers.password = { login: key };
  profile.credentials.passwordHash = await hashPassword(password);
  profile.credentials.passwordUpdatedAt = now();
  db.loginIndex[key] = profile.id;
  saveDb(db);
  return { profile: profilePublic(profile), sessionToken: createSession(profile) };
}

async function loginLocalWithPassword({ login, password }) {
  const db = readDb();
  const profile = db.profiles[db.loginIndex[loginKey(login)]];
  if (!profile || !(await verifyPassword(password, profile.credentials?.passwordHash)))
    throw new Error('Invalid login or password');
  profile.lastSeenAt = now();
  profile.updatedAt = now();
  saveDb(db);
  return { profile: profilePublic(profile), sessionToken: createSession(profile) };
}

function resolveLocalSession(token) {
  const payload = readSession(token);
  if (!payload) return null;
  const db = readDb();
  const profile = db.profiles[payload.profileId];
  return profile?.status === 'active' ? profilePublic(profile) : null;
}

function createLocalBrowserSession(input) {
  const db = readDb();
  const profile = attachBrowser(db, input);
  saveDb(db);
  return { profile: profilePublic(profile), sessionToken: createSession(profile) };
}

function createLocalTelegramSession(initData, input) {
  const telegramUser = verifyTelegramInitData(initData);
  if (!telegramUser) throw new Error('Telegram verification failed');
  const db = readDb();
  const profile = attachTelegram(db, telegramUser, input);
  saveDb(db);
  return { profile: profilePublic(profile), sessionToken: createSession(profile) };
}

function supabaseEnabled() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}

function assertIdentityStorageConfigured() {
  const url = clean(process.env.SUPABASE_URL);
  const key = clean(process.env.SUPABASE_SECRET_KEY);
  const publicKey = /^sb_(publishable|public)_/i.test(key);
  if (url || key) {
    if (!url || !key)
      throw new Error(
        'Supabase identity storage is incomplete: configure both SUPABASE_URL and SUPABASE_SECRET_KEY',
      );
    if (publicKey) throw new Error('SUPABASE_SECRET_KEY must be a server secret key, not a publishable key');
    sessionSecret();
    return;
  }
  if (process.env.ALLOW_LOCAL_AUTH !== 'true' && process.env.NODE_ENV === 'production') {
    throw new Error('Persistent identity storage is required in production');
  }
  sessionSecret();
}

async function supabaseRequest(table, { method = 'GET', filters = {}, select = '*', body, prefer } = {}) {
  const url = new URL(`/rest/v1/${table}`, process.env.SUPABASE_URL);
  if (select) url.searchParams.set('select', select);
  Object.entries(filters).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url, {
    method,
    headers: {
      apikey: process.env.SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(prefer ? { Prefer: prefer } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json().catch(() => []);
  if (!response.ok) {
    const message = payload?.message || payload?.hint || `Supabase ${response.status}`;
    throw new Error(message);
  }
  return payload;
}

async function supabaseFirst(table, filters, select = '*') {
  const rows = await supabaseRequest(table, { filters, select });
  return Array.isArray(rows) ? rows[0] || null : null;
}

function profileFromSupabase(row, identities = []) {
  const providers = {};
  identities.forEach((identity) => {
    const data = identity.metadata || {};
    if (identity.provider === 'telegram') {
      providers.telegram = {
        id: identity.provider_subject,
        username: data.username || '',
        photoUrl: data.photoUrl || row.avatar_url || '',
      };
    }
    if (identity.provider === 'browser') {
      providers.browser = {
        id: identity.provider_subject,
        deviceName: data.deviceName || '',
      };
    }
    if (identity.provider === 'password') {
      providers.password = { login: identity.provider_subject };
    }
  });
  return profilePublic({
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    providers,
    avatar: {
      emoji: row.avatar_emoji,
      gradient: row.avatar_gradient,
      photoUrl: row.avatar_url,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

async function supabasePublicProfile(profileId) {
  const row = await supabaseFirst('fot_profiles', { id: `eq.${profileId}` });
  if (!row || row.status !== 'active') return null;
  const identities = await supabaseRequest('fot_identities', {
    filters: { profile_id: `eq.${profileId}` },
  });
  return profileFromSupabase(row, identities);
}

async function upsertSupabaseProfile(input = {}) {
  const id = clean(input.id || input.profileId);
  if (!id) throw new Error('Profile id is required');
  const row = {
    id,
    username: clean(input.username),
    display_name: clean(input.name || input.displayName),
    avatar_emoji: clean(input.avatarEmoji, '✨').slice(0, 8),
    avatar_gradient: clean(input.avatarGradient, 'lime'),
    avatar_url: clean(input.photoUrl),
    preferences: {
      language: clean(input.language, 'ru'),
      theme: clean(input.theme, 'light'),
    },
    status: 'active',
    last_seen_at: now(),
  };
  await supabaseRequest('fot_profiles?on_conflict=id', {
    method: 'POST',
    body: row,
    prefer: 'resolution=merge-duplicates,return=representation',
  });
}

async function upsertSupabaseIdentity(profileId, provider, subject, metadata = {}) {
  const existing = await supabaseFirst('fot_identities', {
    provider: `eq.${provider}`,
    provider_subject: `eq.${subject}`,
  });
  if (existing && existing.profile_id !== profileId) return existing.profile_id;
  if (existing) {
    await supabaseRequest(`fot_identities?id=eq.${existing.id}`, {
      method: 'PATCH',
      body: { metadata },
      prefer: 'return=representation',
    });
    return profileId;
  }
  await supabaseRequest('fot_identities', {
    method: 'POST',
    body: { profile_id: profileId, provider, provider_subject: subject, metadata },
    prefer: 'return=representation',
  });
  return profileId;
}

async function createSupabaseBrowserSession(input) {
  const deviceId = clean(input.id || input.userId);
  if (!/^web_[a-z0-9_-]{8,}$/i.test(deviceId)) throw new Error('A valid browser identity is required');
  const existing = await supabaseFirst('fot_identities', {
    provider: 'eq.browser',
    provider_subject: `eq.${deviceId}`,
  });
  const initialProfileId = existing?.profile_id || deviceId;
  await upsertSupabaseProfile({ ...input, id: initialProfileId, profileId: initialProfileId });
  const profileId = await upsertSupabaseIdentity(initialProfileId, 'browser', deviceId, {
    deviceName: clean(input.deviceName, 'browser'),
  });
  await supabaseRequest('fot_devices?on_conflict=profile_id,provider,device_name', {
    method: 'POST',
    body: {
      profile_id: profileId,
      provider: 'browser',
      device_name: clean(input.deviceName, 'browser'),
      user_agent: clean(input.userAgent),
      last_seen_at: now(),
    },
    prefer: 'resolution=merge-duplicates,return=representation',
  });
  const profile = await supabasePublicProfile(profileId);
  return { profile, sessionToken: createSession(profile) };
}

async function createSupabaseTelegramSession(initData, input = {}) {
  const user = verifyTelegramInitData(initData);
  if (!user?.id) throw new Error('Telegram verification failed');
  const telegramId = String(user.id);
  const metadata = {
    username: clean(user.username),
    firstName: clean(user.first_name),
    lastName: clean(user.last_name),
    photoUrl: clean(user.photo_url || input.photoUrl),
    lastSyncedAt: now(),
  };
  const existing = await supabaseFirst('fot_identities', {
    provider: 'eq.telegram',
    provider_subject: `eq.${telegramId}`,
  });
  const initialProfileId = existing?.profile_id || telegramId;
  await upsertSupabaseProfile({
    ...input,
    id: initialProfileId,
    username: user.username,
    name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username,
    photoUrl: metadata.photoUrl,
  });
  const profileId = await upsertSupabaseIdentity(initialProfileId, 'telegram', telegramId, metadata);
  await supabaseRequest('fot_devices?on_conflict=profile_id,provider,device_name', {
    method: 'POST',
    body: {
      profile_id: profileId,
      provider: 'telegram',
      device_name: 'Telegram WebApp',
      last_seen_at: now(),
    },
    prefer: 'resolution=merge-duplicates,return=representation',
  });
  const profile = await supabasePublicProfile(profileId);
  return { profile, sessionToken: createSession(profile) };
}

async function registerSupabasePasswordProfile({ login, password, displayName }) {
  const key = loginKey(login);
  if (!/^[a-z0-9._-]{3,48}$/i.test(key))
    throw new Error('Login must be 3–48 characters: letters, digits, dot, dash, or underscore');
  if (String(password || '').length < 10) throw new Error('Password must contain at least 10 characters');
  if (await supabaseFirst('fot_identities', { provider: 'eq.password', provider_subject: `eq.${key}` }))
    throw new Error('This login is already in use');
  const profileId = `profile_${crypto.randomUUID()}`;
  await upsertSupabaseProfile({ id: profileId, username: key, name: displayName || key });
  await upsertSupabaseIdentity(profileId, 'password', key, {});
  await supabaseRequest('fot_credentials', {
    method: 'POST',
    body: { profile_id: profileId, password_hash: await hashPassword(password) },
    prefer: 'return=representation',
  });
  const profile = await supabasePublicProfile(profileId);
  return { profile, sessionToken: createSession(profile) };
}

async function loginSupabaseWithPassword({ login, password }) {
  const identity = await supabaseFirst('fot_identities', {
    provider: 'eq.password',
    provider_subject: `eq.${loginKey(login)}`,
  });
  if (!identity) throw new Error('Invalid login or password');
  const credentials = await supabaseFirst('fot_credentials', { profile_id: `eq.${identity.profile_id}` });
  if (!credentials || !(await verifyPassword(password, credentials.password_hash)))
    throw new Error('Invalid login or password');
  const profile = await supabasePublicProfile(identity.profile_id);
  return { profile, sessionToken: createSession(profile) };
}

async function createBrowserSession(input) {
  assertIdentityStorageConfigured();
  return supabaseEnabled() ? createSupabaseBrowserSession(input) : createLocalBrowserSession(input);
}

async function createTelegramSession(initData, input) {
  assertIdentityStorageConfigured();
  return supabaseEnabled()
    ? createSupabaseTelegramSession(initData, input)
    : createLocalTelegramSession(initData, input);
}

async function registerPasswordProfile(input) {
  assertIdentityStorageConfigured();
  return supabaseEnabled() ? registerSupabasePasswordProfile(input) : registerLocalPasswordProfile(input);
}

async function loginWithPassword(input) {
  assertIdentityStorageConfigured();
  return supabaseEnabled() ? loginSupabaseWithPassword(input) : loginLocalWithPassword(input);
}

async function resolveSession(token) {
  const payload = readSession(token);
  if (!payload) return null;
  return supabaseEnabled() ? supabasePublicProfile(payload.profileId) : resolveLocalSession(token);
}

module.exports = {
  createBrowserSession,
  createTelegramSession,
  registerPasswordProfile,
  loginWithPassword,
  resolveSession,
};
