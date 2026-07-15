'use strict';

const express = require('express');

const router = express.Router();

const MINI_APP_URL = 'https://fototime-ai-mini-app.onrender.com/';
const SUPPORT_URL = 'https://t.me/fototime23_Bot';

const MAIN_KEYBOARD = {
  keyboard: [
    [{ text: 'Старт' }, { text: 'Выбрать участника' }],
    [{ text: 'Выбрать стиль' }, { text: 'Сгенерировать' }],
  ],
  resize_keyboard: true,
  is_persistent: true,
  input_field_placeholder: 'Выберите этап',
};

const OPEN_APP_BUTTON = {
  inline_keyboard: [[{ text: 'Открыть FOT AI', web_app: { url: MINI_APP_URL } }]],
};

function telegramToken() {
  return String(process.env.TELEGRAM_BOT_TOKEN || '').trim();
}

async function telegramRequest(method, payload) {
  const token = telegramToken();
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured');

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  if (!response.ok || !body.ok) {
    throw new Error(`Telegram ${method} failed: ${body.description || response.status}`);
  }
  return body.result;
}

function normalizedText(message) {
  return String(message?.text || '').trim();
}

function responseFor(text) {
  const command = text.split('@')[0].toLowerCase();

  if (command === '/start' || command === 'старт') {
    return {
      text:
        '👋 Добро пожаловать в FOT AI!\n\n' +
        'Пройдите 4 простых этапа: выберите участника, стиль, загрузите фото и запустите генерацию.',
      reply_markup: MAIN_KEYBOARD,
    };
  }

  if (command === '/participant' || command === 'выбрать участника') {
    return {
      text:
        '👤 Этап 2 из 4 — выбор участника.\n\n' +
        'Откройте FOT AI и выберите, чьё изображение будете создавать.',
      reply_markup: OPEN_APP_BUTTON,
    };
  }

  if (command === '/style' || command === 'выбрать стиль') {
    return {
      text:
        '🎨 Этап 3 из 4 — выбор стиля.\n\n' +
        'В приложении выберите подходящий стиль обработки. Его можно сменить перед генерацией.',
      reply_markup: OPEN_APP_BUTTON,
    };
  }

  if (command === '/generate' || command === 'сгенерировать') {
    return {
      text:
        '✨ Этап 4 из 4 — генерация.\n\n' +
        'Загрузите чёткое портретное фото, где лицо хорошо видно, и нажмите «Создать AI-фото».\n\n' +
        `Нужна помощь? ${SUPPORT_URL}`,
      reply_markup: OPEN_APP_BUTTON,
    };
  }

  return {
    text: 'Выберите нужный этап на клавиатуре ниже.',
    reply_markup: MAIN_KEYBOARD,
  };
}

router.get('/webhook', (_req, res) => {
  res.json({ status: 'ok', configured: Boolean(telegramToken()) });
});

router.post('/webhook', async (req, res, next) => {
  try {
    const expectedSecret = String(process.env.TELEGRAM_WEBHOOK_SECRET || '').trim();
    if (expectedSecret) {
      const receivedSecret = String(req.get('x-telegram-bot-api-secret-token') || '');
      if (receivedSecret !== expectedSecret) return res.sendStatus(403);
    }

    const message = req.body?.message;
    if (!message?.chat?.id) return res.sendStatus(200);

    const response = responseFor(normalizedText(message));
    await telegramRequest('sendMessage', {
      chat_id: message.chat.id,
      text: response.text,
      reply_markup: response.reply_markup,
      disable_web_page_preview: true,
    });
    return res.sendStatus(200);
  } catch (error) {
    return next(error);
  }
});

async function registerTelegramWebhook() {
  const token = telegramToken();
  const webhookUrl = String(process.env.TELEGRAM_WEBHOOK_URL || '').trim();
  if (!token || !webhookUrl) return { configured: false };

  const payload = {
    url: webhookUrl,
    allowed_updates: ['message'],
    drop_pending_updates: true,
  };
  const secret = String(process.env.TELEGRAM_WEBHOOK_SECRET || '').trim();
  if (secret) payload.secret_token = secret;
  await telegramRequest('setWebhook', payload);
  return { configured: true };
}

module.exports = { router, registerTelegramWebhook, responseFor, MAIN_KEYBOARD };
