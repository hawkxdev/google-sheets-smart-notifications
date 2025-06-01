/**
 * @fileoverview Основной управляющий скрипт: обрабатывает триггеры, тестирование и настройку системы уведомлений
 *
 * @author hawkxdev
 * @version 1.0
 * @since 2025-05-31
 */

const DEMO_SPREADSHEET_ID = "112TSbwZz04kPHxEDvZBPC_blQ6xVDwZhOcimF32-ClA";

/**
 * Главный триггер для автоматического запуска при редактировании ячеек
 * Координирует работу всех детекторов в системе
 * @param {GoogleAppsScript.Events.SheetsOnEdit} e - Объект события от Google Apps Script
 */
function onEdit(e) {
    try {
        console.log(`[onEdit] Триггер сработал:`, e);

        if (!e?.range) {
            console.log("[onEdit] Некорректный объект события");
            return;
        }

        const currentSpreadsheetId = e.source.getId();
        if (currentSpreadsheetId !== DEMO_SPREADSHEET_ID) {
            console.log(`[onEdit] Игнорируется таблица: ${currentSpreadsheetId} (нужна: ${DEMO_SPREADSHEET_ID})`);
            return;
        }

        const range = e.range;
        const sheet = range.getSheet();
        const sheetName = sheet.getName();

        console.log(`[onEdit] Изменение на листе "${sheetName}", ячейка ${range.getA1Notation()}`);

        if (isSystemSheet(sheetName)) {
            console.log("[onEdit] Игнорируем служебный лист");
            return;
        }

        // Координация работы детекторов

        detectStatusChange(e);

        if (isNewRecordDetectorEnabled()) {
            detectNewRecord(e);
        }

        // Зарезервировано под будущие детекторы
        // detectKPIChanges(e);
        // detectInventoryLow(e);

    } catch (error) {
        console.error("[onEdit] Ошибка:", error.stack || error.message);
        try {
            sendTelegramMessage(`❌ Ошибка в onEdit триггере: ${error.message}`);
        } catch (notificationError) {
            console.error("[onEdit] Ошибка при отправке уведомления:", notificationError.message);
        }
    }
}

/**
 * Тестирует основные компоненты системы
 */
function testSystemSetup() {
    console.log("[testSystemSetup] Запуск теста...");

    const now = new Date();
    const timestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm');

    const testMessage = `🚀 *GOOGLE SHEETS SMART NOTIFICATIONS*\n\n` +
        `✅ **Цветовые индикаторы:** Готов\n` +
        `🆕 **Детектор новых записей:** Готов\n` +
        `🤖 **Telegram интеграция:** Активна\n` +
        `⚙️ **Clasp CLI:** Подключен\n\n` +
        `📅 **Время:** ${timestamp}\n` +
        `🔗 **Статус:** Система работает!\n\n` +
        `📊 **Доступные функции:**\n` +
        `• Мониторинг статусов (✅🟡🔴🟢)\n` +
        `• Уведомления о новых заявках 🆕\n` +
        `• Умное извлечение контекста 🧠`;

    sendTelegramMessage(testMessage);
}

/**
 * Создаёт installable onEdit триггер для демо-таблицы
 * Удаляет старые триггеры и создаёт новый
 */
function createSpreadsheetTrigger() {
    try {
        console.log("[createSpreadsheetTrigger] Удаление старых триггеров...");

        const triggers = ScriptApp.getProjectTriggers();
        let deletedCount = 0;

        triggers.forEach(trigger => {
            if (trigger.getHandlerFunction() === 'onEdit') {
                ScriptApp.deleteTrigger(trigger);
                deletedCount++;
                console.log("[createSpreadsheetTrigger] Удалён старый триггер");
            }
        });

        console.log(`[createSpreadsheetTrigger] Удалено триггеров: ${deletedCount}`);

        const ss = SpreadsheetApp.openById(DEMO_SPREADSHEET_ID);
        ScriptApp.newTrigger('onEdit')
            .forSpreadsheet(ss)
            .onEdit()
            .create();

        console.log("[createSpreadsheetTrigger] Новый триггер создан");
        sendTelegramMessage("✅ Installable onEdit триггер успешно создан!");

        return "Триггер создан успешно!";

    } catch (error) {
        console.error("[createSpreadsheetTrigger] Ошибка:", error.stack || error.message);
        sendTelegramMessage(`❌ Ошибка при создании триггера: ${error.message}`);
        throw error;
    }
}

/**
 * Тестирует детектор новых записей — добавляет строку в лист "Заявки"
 */
function testNewRecordDetector() {
    console.log("[testNewRecordDetector] Запуск теста...");

    try {
        const ss = SpreadsheetApp.openById(DEMO_SPREADSHEET_ID);
        const sheet = ss.getSheetByName("Заявки");

        if (!sheet) {
            throw new Error("Лист 'Заявки' не найден. Убедитесь, что он существует.");
        }

        const newRow = sheet.getLastRow() + 1;
        const now = new Date();

        const testData = [
            now.toLocaleDateString('ru-RU'),
            now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            "Тестовый Клиент",
            "test@example.com",
            "Тестирование детектора",
            "1000₽"
        ];

        sheet.getRange(newRow, 1, 1, testData.length).setValues([testData]);

        console.log(`[testNewRecordDetector] Запись добавлена в строку ${newRow}`);

        sendTelegramMessage(
            `🧪 *ТЕСТ ДЕТЕКТОРА НОВЫХ ЗАПИСЕЙ*\n\n` +
            `Тестовая запись добавлена в строку ${newRow}\n` +
            `Лист: Заявки\n` +
            `Время: ${Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd.MM.yyyy HH:mm')}\n\n` +
            `Если система работает корректно, вы должны получить уведомление о новой заявке.`
        );

    } catch (error) {
        console.error("[testNewRecordDetector] Ошибка:", error.stack || error.message);
        sendTelegramMessage(`❌ Ошибка при тестировании: ${error.message}`);
    }
}
