/**
 * @fileoverview Google Sheets Smart Notifications - Status Change Detector
 * Детектор изменений статусов в ячейках с автоматической отправкой уведомлений
 * 
 * @author hawkxdev
 * @version 1.0
 * @since 2025-05-31
 */

/**
 * Главный триггер для автоматического запуска при редактировании ячеек
 * Эта функция должна быть установлена как onEdit триггер в Google Apps Script
 * @param {Object} e - Объект события от Google Apps Script
 */
function onEdit(e) {
    try {
        console.log("onEdit триггер сработал:", e);

        // Проверяем, что событие валидно
        if (!e?.range) {
            console.log("onEdit: Некорректный объект event");
            return;
        }

        // Проверяем, что это наша демо-таблица
        const targetSpreadsheetId = "112TSbwZz04kPHxEDvZBPC_blQ6xVDwZhOcimF32-ClA";
        const currentSpreadsheetId = e.source?.getId() || SpreadsheetApp.getActiveSpreadsheet().getId();
        
        if (currentSpreadsheetId !== targetSpreadsheetId) {
            console.log(`Игнорируем таблицу: ${currentSpreadsheetId} (нужна: ${targetSpreadsheetId})`);
            return;
        }

        // Получаем информацию о событии
        const range = e.range;
        const sheet = range.getSheet();

        console.log(`Обнаружено изменение на листе "${sheet.getName()}", ячейка ${range.getA1Notation()}`);

        // Проверяем, что это не служебный лист
        if (isSystemSheet(sheet.getName())) {
            console.log("Игнорируем служебные листы");
            return;
        }

        // Запускаем детектор изменений статуса
        detectStatusChange(e);

        // Здесь позже добавим детектор новых записей
        // detectNewRecord(e);

    } catch (error) {
        console.error("Ошибка в onEdit триггере:", error);

        // Отправляем уведомление об ошибке (опционально)
        try {
            sendTelegramMessage(`❌ Ошибка в onEdit триггере: ${error.message}`);
        } catch (notificationError) {
            console.error("Не удалось отправить уведомление об ошибке:", notificationError);
        }
    }
}

/**
 * Основная функция детектора изменений статуса в ячейках
 * Анализирует событие изменения и отправляет уведомления при изменении статуса
 * @param {Object} event - Объект события от Google Apps Script onEdit триггера
 */
function detectStatusChange(event) {
    try {
        // Валидация события
        if (!event?.range) {
            console.log("detectStatusChange: Некорректный объект event");
            return;
        }

        const range = event.range;
        const sheet = range.getSheet();

        console.log(`Проверяем изменение статуса для ячейки ${range.getA1Notation()} на листе "${sheet.getName()}"`);

        // Получаем содержимое ячейки
        const cellValue = range.getValue();
        console.log(`Содержимое ячейки ${range.getA1Notation()}: ${cellValue}`);

        if (!cellValue) {
            console.log("Ячейка пустая, пропускаем");
            return;
        }

        // Определение типа статуса по содержимому
        const statusType = determineStatusType(cellValue);

        // Если это значимый статус - создаем уведомление
        if (statusType) {
            const cellInfo = {
                sheet: sheet.getName(),
                address: range.getA1Notation(),
                value: cellValue,
                statusType: statusType,
                row: range.getRow(),
                col: range.getColumn(),
                timestamp: new Date()
            };

            console.log(`Обнаружено изменение статуса: ${statusType}`);
            createStatusNotification(cellInfo);
        } else {
            console.log("Изменение не является статусом, пропускаем уведомление");
        }

    } catch (error) {
        console.error("Ошибка в detectStatusChange:", error);
    }
}

/**
 * Определяет тип статуса по содержимому ячейки
 * @param {any} cellValue - Содержимое ячейки
 * @return {string|null} Тип статуса или null
 */
function determineStatusType(cellValue) {
    if (!cellValue) return null;

    const valueStr = getCellValueAsString(cellValue);

    // Проверяем эмодзи и символы
    if (valueStr.includes('✅') || valueStr.includes('выполнен')) {
        return STATUS_TYPES.COMPLETED;
    }

    if (valueStr.includes('🟡') || valueStr.includes('в работе')) {
        return STATUS_TYPES.IN_PROGRESS;
    }

    if (valueStr.includes('🔴') || valueStr.includes('проблема')) {
        return STATUS_TYPES.PROBLEM;
    }

    if (valueStr.includes('🟢') || valueStr.includes('готов к сдаче')) {
        return STATUS_TYPES.READY;
    }

    // Проверяем текстовые статусы без эмодзи
    if (valueStr === 'выполнен' || valueStr === 'завершен' || valueStr === 'готово') {
        return STATUS_TYPES.COMPLETED;
    }

    if (valueStr === 'в работе' || valueStr === 'работа' || valueStr === 'processing') {
        return STATUS_TYPES.IN_PROGRESS;
    }

    if (valueStr === 'проблема' || valueStr === 'ошибка' || valueStr === 'error') {
        return STATUS_TYPES.PROBLEM;
    }

    if (valueStr === 'готов к сдаче' || valueStr === 'готов' || valueStr === 'ready') {
        return STATUS_TYPES.READY;
    }

    return null;
}

/**
 * Создает и отправляет уведомление об изменении статуса
 * @param {Object} cellInfo - Информация о ячейке
 */
function createStatusNotification(cellInfo) {
    try {
        // Получаем эмодзи и описание для типа статуса
        const emoji = getStatusEmoji(cellInfo.statusType);
        const statusDescription = getStatusDescription(cellInfo.statusType);

        // Получаем название столбца и контекст строки
        const columnName = getColumnName(cellInfo.sheet, cellInfo.col);
        const rowContext = getRowContext(cellInfo.sheet, cellInfo.row);

        // Формируем сообщение
        const message = `${emoji} *Изменение статуса*\n\n` +
            `📊 *Лист:* ${cellInfo.sheet}\n` +
            `📍 *Ячейка:* ${cellInfo.address}\n` +
            `📝 *Столбец:* ${columnName}\n` +
            `🔄 *Статус:* ${statusDescription}\n` +
            `💬 *Значение:* ${cellInfo.value}\n` +
            `${rowContext}` +
            `⏰ *Время:* ${formatTimestamp(cellInfo.timestamp)}`;

        console.log("Отправляем уведомление об изменении статуса:", message);

        // Отправляем уведомление
        sendTelegramMessage(message);

    } catch (error) {
        console.error("Ошибка при создании уведомления о статусе:", error);
    }
}
