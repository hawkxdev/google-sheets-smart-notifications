/**
 * Google Sheets Smart Notifications - Telegram Integration
 * Основные функции для отправки уведомлений через Telegram Bot API
 */

/**
 * Отправка сообщения в Telegram
 * @param {string} message - Текст сообщения
 * @return {Object} Ответ от Telegram API
 */
function sendTelegramMessage(message) {
  const url = `${CONFIG.TELEGRAM.API_URL}${CONFIG.TELEGRAM.BOT_TOKEN}/sendMessage`;
  
  const payload = {
    chat_id: CONFIG.TELEGRAM.CHAT_ID,
    text: message,
    parse_mode: "Markdown"
  };
  
  try {
    const response = UrlFetchApp.fetch(url, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      payload: JSON.stringify(payload)
    });
    
    const result = JSON.parse(response.getContentText());
    
    if (!result.ok) {
      console.error("Telegram API Error:", result);
    }
    
    return result;
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
    return null;
  }
}
