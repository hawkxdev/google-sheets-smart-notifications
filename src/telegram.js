/**
 * @fileoverview Google Sheets Smart Notifications - Telegram Integration
 * Основные функции для отправки уведомлений через Telegram Bot API
 * 
 * @author hawkxdev
 * @version 1.0
 * @since 2025-05-31
 */

/**
 * Отправка сообщения в Telegram
 * Использует Telegram Bot API для отправки форматированных сообщений с Markdown
 * 
 * @param {string} message - Текст сообщения (поддерживает Markdown разметку)
 * @return {Object|null} Ответ от Telegram API или null при ошибке
 */
function sendTelegramMessage(message) {
  // Формируем URL для Telegram Bot API
  const url = `${CONFIG.TELEGRAM.API_URL}${CONFIG.TELEGRAM.BOT_TOKEN}/sendMessage`;
  
  // Подготавливаем полезную нагрузку для API запроса
  const payload = {
    chat_id: CONFIG.TELEGRAM.CHAT_ID,
    text: message,
    parse_mode: "Markdown" // Включаем поддержку Markdown разметки
  };
  
  try {
    // Отправляем POST запрос к Telegram API
    const response = UrlFetchApp.fetch(url, {
      method: "post",
      headers: {"Content-Type": "application/json"},
      payload: JSON.stringify(payload)
    });
    
    // Парсим ответ от API
    const result = JSON.parse(response.getContentText());
    
    // Проверяем статус ответа
    if (!result.ok) {
      console.error("Ошибка Telegram API:", result);
    }
    
    return result;
  } catch (error) {
    // Логируем ошибку и возвращаем null
    console.error("Не удалось отправить сообщение в Telegram:", error);
    return null;
  }
}
