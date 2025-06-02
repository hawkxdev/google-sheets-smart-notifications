/**
 * @fileoverview Google Sheets Smart Notifications - New Record Detector
 * Детектор новых записей в Google Таблицах (лист "Заявки")
 * Вызывается из main.js onEdit триггера
 *
 * @author hawkxdev
 * @version 1.0
 * @since 2025-06-01
 */

/**
* Основная функция детектора новых записей
* Анализирует событие изменения и отправляет уведомления при добавлении новых строк
* @param {Object} event - Объект события от Google Apps Script onEdit триггера
*/
function detectNewRecord(event) {
try {
// Проверяем, включен ли детектор новых записей
if (!isNewRecordDetectorEnabled()) {
debugLog('[detectNewRecord] Детектор новых записей отключен');
return;
}

// Валидация события
if (!event?.range) {
            debugLog("detectNewRecord: Некорректный объект event");
    return;
        }

const range = event.range;
const sheet = range.getSheet();

debugLog(`[Проверяем новую запись для ячейки ${range.getA1Notation()} на листе "${sheet.getName()}"]`);

// Проверяем, что это новая запись
if (!isNewRecord(event)) {
    debugLog("Это не новая запись, пропускаем уведомление");
            return;
}

        // Извлекаем данные новой записи
    const recordData = extractNewRecordData(sheet, range.getRow());
debugLog("Обнаружена новая запись:", JSON.stringify(recordData, null, 2));

        // Создаем и отправляем уведомление
        createNewRecordNotification(recordData);

    } catch (error) {
        console.error("Ошибка в detectNewRecord:", error);
        debugLog('[detectNewRecord] Критическая ошибка:', error.stack || error.message);
    }
}

/**
 * Проверяет, является ли событие добавлением новой записи
 * @param {Object} event - Объект события от Google Apps Script
 * @return {boolean} true если это новая запись
 */
function isNewRecord(event) {
    const range = event.range;
    const sheet = range.getSheet();
    const sheetName = sheet.getName();

    // Работаем только с листом "Заявки"
    if (sheetName !== "Заявки") {
        console.log(`Лист "${sheetName}" не отслеживается для новых записей`);
        return false;
    }

    // Игнорируем заголовки (первая строка)
    const rowIndex = range.getRow();
    if (rowIndex <= 1) {
        console.log("Игнорируем изменения в заголовках");
        return false;
    }

    // Проверяем, была ли строка пустой до изменения
    if (!isRowEmpty(sheet, rowIndex, range)) {
        console.log(`Строка ${rowIndex} уже содержала данные - это изменение, а не новая запись`);
        return false;
    }

    // Проверяем тип изменения (массовая вставка или одиночная ячейка)
    const rangeData = range.getValues();
    const isMassInsertion = rangeData.length > 1 || rangeData[0].length > 1;

    return isMassInsertion ?
        checkMassInsertion(rangeData, rowIndex) :
        checkSingleCell(range, rowIndex);
}

/**
 * Проверяет, была ли строка пустой до изменения
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Лист таблицы
 * @param {number} rowIndex - Индекс строки
 * @param {GoogleAppsScript.Spreadsheet.Range} changedRange - Измененный диапазон
 * @return {boolean} true если строка была пустой
 */
function isRowEmpty(sheet, rowIndex, changedRange) {
    // Получаем все данные строки
    const rowData = sheet.getRange(rowIndex, 1, 1, 6).getValues()[0];

    // Получаем индексы измененных колонок
    const changedColumns = [];
    for (let col = changedRange.getColumn(); col < changedRange.getColumn() + changedRange.getNumColumns(); col++) {
        changedColumns.push(col - 1); // -1 потому что индексы в массиве начинаются с 0
    }

    // Проверяем, были ли заполнены другие колонки
    for (let i = 0; i < rowData.length; i++) {
        // Пропускаем измененные колонки
        if (changedColumns.indexOf(i) !== -1) continue;

        // Если найдена заполненная ячейка - строка не была пустой
        if (rowData[i] && rowData[i].toString().trim() !== '') {
            return false;
        }
    }

    return true;
}

/**
 * Проверяет массовую вставку на наличие новых записей
 * @param {Array} rangeData - Данные диапазона
 * @param {number} startRow - Начальная строка
 * @return {boolean} true если найдена новая запись
 */
function checkMassInsertion(rangeData, startRow) {
    const numRows = rangeData.length;
    const numCols = rangeData[0].length;

    console.log(`Обнаружена массовая вставка: ${numRows} строк, ${numCols} колонок`);

    for (let i = 0; i < numRows; i++) {
        const rowData = rangeData[i];
        const hasClient = rowData[2] && rowData[2].toString().trim() !== ''; // Колонка C
        const hasService = rowData[4] && rowData[4].toString().trim() !== ''; // Колонка E

        if (hasClient || hasService) {
            console.log(`Найдена новая запись в строке ${startRow + i} - заполнено ${hasClient ? 'Клиент' : 'Услуга'}`);
            return true;
        }
    }

    console.log("В массовой вставке не найдено ключевых полей");
    return false;
}

/**
 * Проверяет одиночную ячейку на наличие новой записи
 * @param {GoogleAppsScript.Spreadsheet.Range} range - Диапазон ячеек
 * @param {number} rowIndex - Индекс строки
 * @return {boolean} true если это новая запись
 */
function checkSingleCell(range, rowIndex) {
    const cellValue = range.getValue();
    if (!cellValue || cellValue.toString().trim() === '') {
        console.log("Ячейка пустая, не считаем новой записью");
        return false;
    }

    const columnIndex = range.getColumn();
    const keyColumns = [3, 5]; // C: Клиент, E: Услуга

    if (keyColumns.indexOf(columnIndex) === -1) {
        console.log(`Столбец ${columnIndex} не является ключевым (Клиент или Услуга) - пропускаем уведомление`);
        return false;
    }

    console.log(`Найдена новая запись в строке ${rowIndex} - заполнено ${columnIndex === 3 ? 'Клиент' : 'Услуга'}`);
    return true;
}

/**
 * Извлекает данные из новой записи для формирования уведомления
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Лист Google Таблицы
 * @param {number} rowIndex - Индекс строки (1-based)
 * @return {Object} Объект с данными записи
 */
function extractNewRecordData(sheet, rowIndex) {
    try {
        // Получаем все данные строки (6 столбцов: A-F)
        const rowData = sheet.getRange(rowIndex, 1, 1, 6).getValues()[0];

        // Извлекаем данные по столбцам согласно структуре листа "Заявки"
        const recordData = {
            row: rowIndex,
            sheet: sheet.getName(),
            timestamp: new Date(),
            date: rowData[0] || '', // A: Дата
            time: rowData[1] || '', // B: Время
            client: rowData[2] || '', // C: Клиент
            email: rowData[3] || '', // D: Email
            service: rowData[4] || '', // E: Услуга
            budget: rowData[5] || '', // F: Бюджет
        };

        // Форматируем время если это число (Google Sheets время)
        if (typeof recordData.time === 'number') {
            const hours = Math.floor(recordData.time * 24);
            const minutes = Math.floor((recordData.time * 24 * 60) % 60);
            const hoursStr = hours < 10 ? '0' + hours : hours.toString();
            const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
            recordData.time = hoursStr + ':' + minutesStr;
        }

        return recordData;

    } catch (error) {
        console.error("Ошибка при извлечении данных записи:", error);
        return null;
    }
}

/**
 * Создает и отправляет уведомление о новой записи
 * @param {Object} recordData - Данные новой записи
 */
function createNewRecordNotification(recordData) {
    try {
        // Формируем информативное сообщение
        let message = `🆕 *НОВАЯ ЗАЯВКА!*\n\n`;

        // Добавляем поля если они заполнены
        if (recordData.date) {
            message += `📅 *Дата:* ${recordData.date}\n`;
        }

        if (recordData.time) {
            message += `⏰ *Время:* ${recordData.time}\n`;
        }

        if (recordData.client) {
            message += `👤 *Клиент:* ${recordData.client}\n`;
        }

        if (recordData.email) {
            message += `📧 *Email:* ${recordData.email}\n`;
        }

        if (recordData.service) {
            message += `💼 *Услуга:* ${recordData.service}\n`;
        }

        if (recordData.budget) {
            message += `💰 *Бюджет:* ${recordData.budget}\n`;
        }

        // Добавляем техническую информацию
        message += `\n📋 *Строка:* ${recordData.row}\n`;
        message += `📊 *Лист:* ${recordData.sheet}\n`;
        message += `⏰ *Получено:* ${formatTimestamp(recordData.timestamp)}`;

        console.log("Отправляем уведомление о новой записи:", message);

        // Отправляем уведомление через Telegram
        sendTelegramMessage(message);

    } catch (error) {
        console.error("Ошибка при создании уведомления о новой записи:", error);
    }
}

/**
 * Проверяет настройки для детектора новых записей
 * Использует централизованную систему настроек
 * @return {boolean} true если детектор включен
 */
function isNewRecordDetectorEnabled() {
    return getSystemSetting('ENABLE_NEW_RECORDS', true);
}
