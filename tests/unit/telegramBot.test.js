'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { responseFor, MAIN_KEYBOARD } = require('../../src/server/routes/telegramBot');

test('start returns the persistent four-stage keyboard', () => {
  const response = responseFor('/start');
  assert.deepEqual(response.reply_markup, MAIN_KEYBOARD);
  assert.deepEqual(
    MAIN_KEYBOARD.keyboard.flat().map((button) => button.text),
    ['Старт', 'Выбрать участника', 'Выбрать стиль', 'Сгенерировать'],
  );
});

test('each stage returns an app-opening action', () => {
  for (const text of ['Выбрать участника', 'Выбрать стиль', 'Сгенерировать']) {
    const response = responseFor(text);
    assert.equal(response.reply_markup.inline_keyboard[0][0].text, 'Открыть FOT AI');
  }
});
