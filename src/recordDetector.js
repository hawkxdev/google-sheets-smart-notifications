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
        // Валидация события
        if (!event?.range) {
            console.log("detectNewRecord: Некорректный объект event");
            return;
        }

        const range = event.range;
        const sheet = range.getSheet();

        console.log(`Проверяем новую запись для ячейки ${range.getA1Notation()} на листе "${sheet.getName()}"`);

        // Проверяем, что это новая запись
        if (!isNewRecord(event)) {
            console.log("Это не новая запись, пропускаем уведомление");
            return;
        }

        // Извлекаем данные новой записи
        const recordData = extractNewRecordData(sheet, range.getRow());

        // Валидируем данные (достаточно ли информации для уведомления)
        if (!validateRecordData(recordData)) {
            console.log("Недостаточно данных для создания уведомления");
            return;
        }

        console.log("Обнаружена новая запись:", recordData);

        // Создаем и отправляем уведомление
        createNewRecordNotification(recordData);

    } catch (error) {
        console.error("Ошибка в detectNewRecord:", error);
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

    // Проверяем, что в ячейке появились данные (не пустая)
    const cellValue = range.getValue();
    if (!cellValue || cellValue.toString().trim() === '') {
        console.log("Ячейка пустая, не считаем новой записью");
        return false;
    }

    // 🔥 УЛУЧШЕННАЯ ЛОГИКА:
    
    // 1. Проверяем что это ключевое поле для новых записей
    const columnIndex = range.getColumn();
    const keyColumns = [1, 2, 3, 5]; // Дата, Время, Клиент, Услуга (основные поля для новых заявок)
    
    if (keyColumns.indexOf(columnIndex) === -1) {
    console.log(`Столбец ${columnIndex} не является ключевым для новых записей`);
    return false;
    }

    // 2. Подсчитываем количество заполненных ячеек в строке
    const rowData = sheet.getRange(rowIndex, 1, 1, 6).getValues()[0];
    const filledCells = rowData.filter(cell => 
    cell && cell.toString().trim() !== ''
    ).length;

    console.log(`Строка ${rowIndex}: заполнено ${filledCells} из 6 ячеек`);

    // 🎯 ЛОГИКА: Уведомляем ТОЛЬКО при вводе КЛИЕНТА (столбец 3)
    
    // Проверяем что это именно столбец "Клиент" (C)
    if (columnIndex !== 3) {
        console.log(`Столбец ${columnIndex} не является полем "Клиент" - пропускаем уведомление`);
        return false;
    }
    
    // Если заполняется поле "Клиент" - это новая запись (независимо от количества других ячеек)
    console.log(`Найдена новая запись в строке ${rowIndex} - заполнен Клиент (${filledCells} ячеек в строке)`);
    return true;
    
    // Дополнительная проверка для массовой вставки (Ctrl+C/Ctrl+V) - уже не нужна
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
            // Основные поля
            date: rowData[0] || '', // A: Дата
            time: rowData[1] || '', // B: Время
            client: rowData[2] || '', // C: Клиент
            email: rowData[3] || '', // D: Email
            service: rowData[4] || '', // E: Услуга
            budget: rowData[5] || '', // F: Бюджет
        };

        // Форматируем время если это число (Google Sheets время)
        if (typeof recordData.time === 'number') {
            // Преобразуем число в формат времени
            const hours = Math.floor(recordData.time * 24);
            const minutes = Math.floor((recordData.time * 24 * 60) % 60);
            // Используем совместимый способ добавления ведущих нулей
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
 * Валидирует данные записи - проверяет достаточно ли информации для уведомления
 * @param {Object} recordData - Данные записи
 * @return {boolean} true если данных достаточно
 */
function validateRecordData(recordData) {
    if (!recordData) {
        return false;
    }

    // Минимальные требования: должен быть заполнен клиент ИЛИ услуга
    const hasClient = recordData.client && recordData.client.toString().trim() !== '';
    const hasService = recordData.service && recordData.service.toString().trim() !== '';

    if (!hasClient && !hasService) {
        console.log("Запись не содержит ни клиента, ни услуги - пропускаем");
        return false;
    }

    return true;
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
 * Получает все новые записи с момента последней проверки (для будущего использования)
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Лист для проверки
 * @param {number} lastKnownRow - Последняя известная строка с данными
 * @return {Array} Массив новых записей
 */
function getNewRecordsSince(sheet, lastKnownRow) {
    try {
        const currentLastRow = sheet.getLastRow();

        if (currentLastRow <= lastKnownRow) {
            return [];
        }

        const newRows = [];
        for (let row = lastKnownRow + 1; row <= currentLastRow; row++) {
            const recordData = extractNewRecordData(sheet, row);
            if (validateRecordData(recordData)) {
                newRows.push(recordData);
            }
        }

        return newRows;

    } catch (error) {
        console.error("Ошибка при получении новых записей:", error);
        return [];
    }
}

/**
 * Проверяет настройки для детектора новых записей из листа "Настройки"
 * @return {boolean} true если детектор включен
 */
function isNewRecordDetectorEnabled() {
    try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const settingsSheet = ss.getSheetByName("Настройки");

        if (!settingsSheet) {
            console.log("Лист 'Настройки' не найден, используем значение по умолчанию: true");
            return true;
        }

        // Ищем параметр ENABLE_NEW_RECORDS в колонке A
        const settingsData = settingsSheet.getRange("A:B").getValues();

        for (const row of settingsData) {
            if (row[0] === "ENABLE_NEW_RECORDS") {
                const value = row[1];
                return value === true || value === "TRUE" || value === "true";
            }
        }

        // Если параметр не найден, по умолчанию включаем
        console.log("Параметр ENABLE_NEW_RECORDS не найден, используем значение по умолчанию: true");
        return true;

    } catch (error) {
        console.error("Ошибка при проверке настроек детектора:", error);
        return true; // По умолчанию включаем при ошибке
    }
}
