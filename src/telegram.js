/**
 * @fileoverview Google Sheets Smart Notifications - Telegram Integration
 * Основные функции для отправки уведомлений через Telegram Bot API
 *
 * @author hawkxdev
 * @version 1.0
 * @since 2025-05-31
 */

/**
 * Отправка сообщения в Telegram с интегрированными проверками
 * Использует Telegram Bot API для отправки форматированных сообщений с Markdown
 *
 * @param {string} message - Текст сообщения (поддерживает Markdown разметку)
 * @return {Object|null} Ответ от Telegram API или null при ошибке
 */
function sendTelegramMessage(message) {
  try {
    // Проверяем лимиты частоты уведомлений
    if (!checkNotificationRateLimit()) {
      debugLog('[sendTelegramMessage] Превышен лимит частоты уведомлений, сообщение пропущено');
      return { ok: false, error: 'Rate limit exceeded' };
    }

    debugLog('[sendTelegramMessage] Отправка сообщения:', message.substring(0, 100) + '...');

    // Формируем URL для Telegram Bot API
    const url = `${CONFIG.TELEGRAM.API_URL}${CONFIG.TELEGRAM.BOT_TOKEN}/sendMessage`;

    // Подготавливаем полезную нагрузку для API запроса
    const payload = {
      chat_id: CONFIG.TELEGRAM.CHAT_ID,
      text: message,
      parse_mode: "Markdown" // Включаем поддержку Markdown разметки
    };

    // Отправляем POST запрос к Telegram API
    const response = UrlFetchApp.fetch(url, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      payload: JSON.stringify(payload)
    });

    // Парсим ответ от API
    const result = JSON.parse(response.getContentText());

    // Проверяем статус ответа
    if (!result?.ok) {
      console.error("Ошибка Telegram API:", result);
      debugLog('[sendTelegramMessage] Ошибка API:', JSON.stringify(result));
      return result;
    }

    debugLog('[sendTelegramMessage] Сообщение успешно отправлено');

    // Задержка между уведомлениями
    addNotificationDelay();

    return result;

  } catch (error) {
    // Логируем ошибку и возвращаем null
    console.error("Не удалось отправить сообщение в Telegram:", error);
    debugLog('[sendTelegramMessage] Исключение:', error.stack || error.message);

    // Попытка отправить упрощенное сообщение об ошибке
    try {
      const errorUrl = `${CONFIG.TELEGRAM.API_URL}${CONFIG.TELEGRAM.BOT_TOKEN}/sendMessage`;
      const errorPayload = {
        chat_id: CONFIG.TELEGRAM.CHAT_ID,
        text: `❌ Ошибка системы уведомлений: ${error.message}`,
        parse_mode: "Markdown"
      };

      UrlFetchApp.fetch(errorUrl, {
        method: "post",
        headers: { "Content-Type": "application/json" },
        payload: JSON.stringify(errorPayload)
      });

    } catch (fallbackError) {
      console.error("Не удалось отправить даже упрощенное сообщение об ошибке:", fallbackError);
    }

    return null;
  }
}

/**
 * Отправляет тестовое сообщение для проверки подключения
 * @return {boolean} true если сообщение отправлено успешно
 */
function testTelegramConnection() {
  try {
    const testMessage = `🧪 *ТЕСТ ПОДКЛЮЧЕНИЯ*\n\n` +
      `⏰ Время: ${formatTimestamp(new Date())}\n` +
      `🤖 Бот: ${CONFIG.TELEGRAM.BOT_USERNAME}\n` +
      `📊 Chat ID: ${CONFIG.TELEGRAM.CHAT_ID}\n\n` +
      `✅ Telegram интеграция работает!`;

    const result = sendTelegramMessage(testMessage);
    return result?.ok || false;

  } catch (error) {
    console.error('Ошибка при тестировании Telegram подключения:', error);
    return false;
  }
}
