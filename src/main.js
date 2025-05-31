/**
 * @fileoverview Google Sheets Smart Notifications - Main Functions
 * Основные функции для тестирования и настройки системы
 *
 * @author hawkxdev
 * @version 1.0
 * @since 2025-05-31
 */

/**
 * Тестирует основные компоненты системы
 * Проверяет подключение к Telegram Bot API и отправку уведомлений
 *
 * @return {void}
 */
function testSystemSetup() {
    console.log("Тестирование системы...");

    const testMessage = `CLASP DEPLOY TEST\n\n` +
        `Time: ${new Date().toLocaleString('ru-RU')}\n` +
        `Connection: Google Sheets + Clasp CLI\n` +
        `Status: COMPLETED`;

    sendTelegramMessage(testMessage);
}

/**
 * Создает installable onEdit триггер для нашей демо-таблицы
 * Удаляет существующие триггеры и создает новый привязанный к конкретной таблице
 *
 * @return {string} Сообщение о результате создания триггера
 * @throws {Error} Ошибка при создании триггера
 */
function createSpreadsheetTrigger() {
    try {
        console.log("Создаем installable триггер для демо-таблицы...");

        // ID нашей демо-таблицы
        const spreadsheetId = "112TSbwZz04kPHxEDvZBPC_blQ6xVDwZhOcimF32-ClA";

        // Удаляем существующие триггеры onEdit (если есть)
        const triggers = ScriptApp.getProjectTriggers();
        let deletedCount = 0;

        triggers.forEach(trigger => {
            if (trigger.getHandlerFunction() === 'onEdit') {
                ScriptApp.deleteTrigger(trigger);
                deletedCount++;
                console.log("Удален старый триггер onEdit");
            }
        });

        console.log(`Удалено старых триггеров: ${deletedCount}`);

        // Создаем новый installable trigger для конкретной таблицы
        const ss = SpreadsheetApp.openById(spreadsheetId);
        ScriptApp.newTrigger('onEdit')
            .forSpreadsheet(ss)
            .onEdit()
            .create();

        console.log(`Создан onEdit триггер для таблицы: ${spreadsheetId}`);
        sendTelegramMessage("Installable onEdit триггер успешно создан для демо-таблицы!");

        return "Триггер создан успешно!";

    } catch (error) {
        console.error("Ошибка при создании триггера:", error);
        sendTelegramMessage(`❌ Ошибка при создании триггера: ${error.message}`);
        throw error;
    }
}
