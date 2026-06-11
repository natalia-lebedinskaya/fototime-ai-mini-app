async function ftTelegramNotifyAdmin(text) {
  const token =
    process.env.FT_TELEGRAM_BOT_TOKEN ||
    process.env.TELEGRAM_BOT_TOKEN ||
    process.env.BOT_TOKEN;

  const chatId =
    process.env.FT_TELEGRAM_ADMIN_CHAT_ID ||
    process.env.TELEGRAM_ADMIN_CHAT_ID ||
    process.env.ADMIN_CHAT_ID ||
    process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[FOTOTIME Telegram notify skipped] missing bot token or admin chat id");
    return { ok: false, skipped: true };
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("[FOTOTIME Telegram notify failed]", response.status, body);
    return { ok: false, status: response.status };
  }

  return { ok: true };
}

module.exports = { ftTelegramNotifyAdmin };
