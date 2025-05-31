/**
 * @fileoverview Google Sheets Smart Notifications - Utilities
 * Вспомогательные функции общего назначения
 *
 * @author hawkxdev
 * @version 1.0
 * @since 2025-05-31
 */

/**
 * Константы для типов статусов
 */
const STATUS_TYPES = {
    COMPLETED: 'completed',
    IN_PROGRESS: 'in_progress',
    PROBLEM: 'problem',
    READY: 'ready'
};

/**
 * Ключевые столбцы для контекста
 */
const KEY_COLUMNS = ['клиент', 'товар', 'заказ', 'проект', 'задача', 'id'];

/**
 * Преобразует индекс столбца в буквенное обозначение
 * @param {number} colIndex - Индекс столбца (1-based)
 * @return {string} Буквенное обозначение (A, B, C, ...)
 */
function columnIndexToLetter(colIndex) {
    let letter = '';
    while (colIndex > 0) {
        colIndex--;
        letter = String.fromCharCode(65 + (colIndex % 26)) + letter;
        colIndex = Math.floor(colIndex / 26);
    }
    return letter;
}

/**
 * Получает название столбца из первой строки листа
 * @param {string} sheetName - Название листа
 * @param {number} colIndex - Индекс столбца (1-based)
 * @return {string} Название столбца или буквенное обозначение
 */
function getColumnName(sheetName, colIndex) {
    try {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

        // Проверяем, что лист найден
        if (!sheet) {
            console.error(`Лист '${sheetName}' не найден`);
            return columnIndexToLetter(colIndex);
        }

        const headerValue = sheet.getRange(1, colIndex).getValue();

        if (headerValue?.toString().trim()) {
            return headerValue.toString();
        }

        // Возвращаем буквенное обозначение столбца как fallback
        return columnIndexToLetter(colIndex);

    } catch (error) {
        console.error("Ошибка при получении имени столбца:", error);
        return columnIndexToLetter(colIndex);
    }
}

/**
 * Получает контекст строки - данные из ключевых столбцов
 * @param {string} sheetName - Название листа
 * @param {number} rowIndex - Индекс строки (1-based)
 * @return {string} Контекстная информация
 */
function getRowContext(sheetName, rowIndex) {
    try {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

        // Проверяем, что лист найден
        if (!sheet) {
            console.error(`Лист '${sheetName}' не найден`);
            return '';
        }

        // Получаем заголовки из первой строки
        const lastColumn = sheet.getLastColumn();
        const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];

        // Получаем данные из текущей строки
        const rowData = sheet.getRange(rowIndex, 1, 1, lastColumn).getValues()[0];

        let context = '';

        // Ищем ключевые столбцы для контекста
        for (let i = 0; i < headers.length; i++) {
            const header = headers[i]?.toString().toLowerCase();
            const value = rowData[i];

            if (value && KEY_COLUMNS.some(key => header?.includes(key))) {
                context += `📋 *${headers[i]}:* ${value}\n`;
            }
        }

        return context;

    } catch (error) {
        console.error("Ошибка при получении контекста строки:", error);
        return '';
    }
}

/**
 * Возвращает эмодзи для типа статуса
 * @param {string} statusType - Тип статуса
 * @return {string} Эмодзи
 */
function getStatusEmoji(statusType) {
    const emojis = {
        [STATUS_TYPES.COMPLETED]: '✅',
        [STATUS_TYPES.IN_PROGRESS]: '🟡',
        [STATUS_TYPES.PROBLEM]: '🔴',
        [STATUS_TYPES.READY]: '🟢'
    };
    return emojis[statusType] || '🔄';
}

/**
 * Возвращает описание статуса
 * @param {string} statusType - Тип статуса
 * @return {string} Описание
 */
function getStatusDescription(statusType) {
    const descriptions = {
        [STATUS_TYPES.COMPLETED]: 'Выполнен',
        [STATUS_TYPES.IN_PROGRESS]: 'В работе',
        [STATUS_TYPES.PROBLEM]: 'Проблема',
        [STATUS_TYPES.READY]: 'Готов к сдаче'
    };
    return descriptions[statusType] || 'Неизвестный статус';
}

/**
 * Проверяет, является ли лист служебным
 * @param {string} sheetName - Название листа
 * @return {boolean} true, если лист служебный
 */
function isSystemSheet(sheetName) {
    return sheetName === "Настройки" || sheetName.startsWith("_");
}

/**
 * Форматирует временную метку для уведомлений
 * @param {Date} timestamp - Временная метка
 * @return {string} Отформатированное время
 */
function formatTimestamp(timestamp) {
    return timestamp.toLocaleString('ru-RU');
}

/**
 * Безопасно получает значение ячейки как строку
 * @param {any} cellValue - Значение ячейки
 * @return {string} Строковое представление значения
 */
function getCellValueAsString(cellValue) {
    if (!cellValue) return '';
    return cellValue.toString().toLowerCase().trim();
}
