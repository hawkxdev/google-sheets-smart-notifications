/**
 * @fileoverview Google Sheets Smart Notifications - Status Change Detector
 * Детектор изменений статусов в ячейках (эмодзи + текстовые статусы)
 * Вызывается из main.js onEdit триггера
 *
 * @author hawkxdev
 * @version 1.0
 * @since 2025-05-31
 */

const STATUS_KEYWORDS = {
    completed: ['✅', 'выполнен', 'завершен', 'готово'],
    in_progress: ['🟡', 'в работе', 'работа', 'processing'],
    problem: ['🔴', 'проблема', 'ошибка', 'error'],
    ready: ['🟢', 'готов к сдаче', 'готов', 'ready']
};

/**
 * Обрабатывает изменение в ячейке и отправляет уведомление, если обнаружен статус
 * @param {GoogleAppsScript.Events.SheetsOnEdit} event - Объект события onEdit
 */
function detectStatusChange(event) {
    try {
        if (!event?.range) {
            console.log("detectStatusChange: Некорректный объект event", event);
            return;
        }

        const range = event.range;
        const sheet = range.getSheet();
        const cellValue = range.getValue();

        console.log(`Проверяем ячейку ${range.getA1Notation()} на листе "${sheet.getName()}": ${cellValue}`);

        const statusType = determineStatusType(cellValue);
        if (!statusType) {
            console.log("Изменение не является статусом — пропускаем");
            return;
        }

        const cellInfo = {
            sheet: sheet.getName(),
            address: range.getA1Notation(),
            value: cellValue,
            statusType: statusType,
            row: range.getRow(),
            col: range.getColumn(),
            timestamp: new Date()
        };

        const message = buildStatusMessage(cellInfo);
        console.log("Отправка уведомления:", message);
        sendTelegramMessage(message);

    } catch (error) {
        console.error("Ошибка в detectStatusChange:", error.stack || error.message);
    }
}

/**
 * Определяет тип статуса по значению ячейки
 * @param {any} cellValue - Значение ячейки
 * @return {string|null} Статус или null
 */
function determineStatusType(cellValue) {
    if (!cellValue) return null;

    const valueStr = String(cellValue).toLowerCase().trim();

    for (const type in STATUS_KEYWORDS) {
        if (STATUS_KEYWORDS.hasOwnProperty(type)) {
            const keywords = STATUS_KEYWORDS[type];
            for (const keyword of keywords) {
                if (valueStr.includes(keyword)) {
                    return type;
                }
            }
        }
    }

    return null;
}

/**
 * Формирует сообщение об изменении статуса
 * @param {Object} cellInfo - Данные об изменении
 * @return {string} Текст сообщения
 */
function buildStatusMessage(cellInfo) {
    const emoji = getStatusEmoji(cellInfo.statusType);
    const statusDescription = getStatusDescription(cellInfo.statusType);
    const columnName = getColumnName(cellInfo.sheet, cellInfo.col);
    const rowContext = getRowContext(cellInfo.sheet, cellInfo.row);
    const timestamp = formatTimestamp(cellInfo.timestamp);

    return `${emoji} *Изменение статуса*\n\n` +
        `📊 *Лист:* ${cellInfo.sheet}\n` +
        `📍 *Ячейка:* ${cellInfo.address}\n` +
        `📝 *Столбец:* ${columnName}\n` +
        `🔄 *Статус:* ${statusDescription}\n` +
        `💬 *Значение:* ${cellInfo.value}\n` +
        `${rowContext}` +
        `⏰ *Время:* ${timestamp}`;
}
