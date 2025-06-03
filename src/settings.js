/**
 * @fileoverview Google Sheets Smart Notifications - Settings Management
 * Cистема управления настройками из Google Таблицы
 *
 * @author hawkxdev
 * @version 1.0
 * @since 2025-06-02
 */

/**
 * Настройки по умолчанию
 */
const DEFAULT_SETTINGS = {
    ENABLE_COLOR_NOTIFICATIONS: true,
    ENABLE_NEW_RECORDS: true,
    NOTIFICATION_DELAY_MS: 1000,
    MAX_NOTIFICATIONS_PER_MINUTE: 10,
    ENABLE_DEBUG_LOGGING: false,
    SYSTEM_SHEETS_EXCLUDE: 'Настройки'
};

/**
 * Кэш настроек для оптимизации
 */
let settingsCache = null;
let lastCacheUpdate = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 минут

/**
 * Счетчик уведомлений для rate limiting
 */
let notificationCount = 0;
let notificationWindowStart = new Date();

/**
 * Централизованная функция чтения настроек из листа "Настройки"
 * @param {string} parameterName - Название параметра
 * @param {any} defaultValue - Значение по умолчанию
 * @return {any} Значение параметра
 */
function getSystemSetting(parameterName, defaultValue = null) {
    try {
        // Проверяем кэш
        const now = new Date();
        if (settingsCache && lastCacheUpdate && (now.getTime() - lastCacheUpdate.getTime()) < CACHE_DURATION_MS) {
            if (settingsCache.hasOwnProperty(parameterName)) {
                debugLog(`[getSystemSetting] Из кэша: ${parameterName} = ${settingsCache[parameterName]}`);
                return settingsCache[parameterName];
            }
        }

        // Обновляем кэш
        refreshSettingsCache();

        const defaultOrFallback = defaultValue !== null ? defaultValue : DEFAULT_SETTINGS[parameterName];
        const value = settingsCache?.hasOwnProperty(parameterName)
            ? settingsCache[parameterName]
            : defaultOrFallback;

        debugLog(`[getSystemSetting] ${parameterName} = ${value}`);
        return value;

    } catch (error) {
        console.error(`Ошибка при чтении настройки ${parameterName}:`, error);
        const fallbackValue = defaultValue !== null ? defaultValue : DEFAULT_SETTINGS[parameterName];
        return fallbackValue;
    }
}

/**
 * Обновляет кэш настроек из Google Таблицы
 */
function refreshSettingsCache() {
    try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const settingsSheet = ss.getSheetByName("Настройки");

        if (!settingsSheet) {
            console.log("Лист 'Настройки' не найден, используем значения по умолчанию");
            settingsCache = { ...DEFAULT_SETTINGS };
            return;
        }

        // Читаем все настройки одним запросом
        const settingsData = settingsSheet.getRange("A:B").getValues();
        const newCache = {};

        for (const row of settingsData) {
            if (row[0]?.toString().trim()) {
                const paramName = row[0].toString().trim();
                let paramValue = row[1];

                // Приводим типы
                if (paramValue === 'TRUE' || paramValue === 'true' || paramValue === true) {
                    paramValue = true;
                } else if (paramValue === 'FALSE' || paramValue === 'false' || paramValue === false) {
                    paramValue = false;
                }
                // Для чисел и строк оставляем как есть

                newCache[paramName] = paramValue;
            }
        }

        settingsCache = { ...DEFAULT_SETTINGS, ...newCache };
        lastCacheUpdate = new Date();

        debugLog('[refreshSettingsCache] Кэш настроек обновлен:', Object.keys(settingsCache).length, 'параметров');

    } catch (error) {
        console.error("Ошибка при обновлении кэша настроек:", error);
        settingsCache = { ...DEFAULT_SETTINGS };
    }
}

/**
 * Проверяет лимиты уведомлений (rate limiting)
 * @return {boolean} true если можно отправлять уведомление
 */
function checkNotificationRateLimit() {
    const maxPerMinute = getSystemSetting('MAX_NOTIFICATIONS_PER_MINUTE', 10);
    const now = new Date();

    // Сброс счетчика каждую минуту
    if ((now.getTime() - notificationWindowStart.getTime()) >= 60000) {
        notificationCount = 0;
        notificationWindowStart = now;
    }

    if (notificationCount >= maxPerMinute) {
        debugLog(`[checkNotificationRateLimit] Лимит превышен: ${notificationCount}/${maxPerMinute}`);
        return false;
    }

    notificationCount++;
    debugLog(`[checkNotificationRateLimit] Разрешено: ${notificationCount}/${maxPerMinute}`);
    return true;
}

/**
 * Логирует сообщения только если включен debug режим
 * @param {...any} args - Аргументы для логирования
 */
function debugLog(...args) {
    if (getSystemSetting('ENABLE_DEBUG_LOGGING', false)) {
        console.log('[DEBUG]', ...args);
    }
}

/**
 * Добавляет задержку между уведомлениями для предотвращения спама
 */
function addNotificationDelay() {
    const delayMs = getSystemSetting('NOTIFICATION_DELAY_MS', 1000);
    if (delayMs > 0) {
        Utilities.sleep(delayMs);
        debugLog(`[addNotificationDelay] Задержка: ${delayMs}ms`);
    }
}

/**
 * Проверяет, является ли лист служебным
 * @param {string} sheetName - Название листа
 * @return {boolean} true, если лист служебный
 */
function isSystemSheet(sheetName) {
    const excludeList = getSystemSetting('SYSTEM_SHEETS_EXCLUDE', 'Настройки,Лог');
    const systemSheets = excludeList.split(',').map(name => name.trim());

    return systemSheets.includes(sheetName) || sheetName.startsWith("_");
}

/**
 * Проверяет настройки для детектора новых записей
 * @return {boolean} true если детектор включен
 */
function isNewRecordDetectorEnabled() {
    return getSystemSetting('ENABLE_NEW_RECORDS', true);
}

/**
 * Проверяет настройки для детектора цветовых уведомлений
 * @return {boolean} true если детектор включен
 */
function isColorNotificationsEnabled() {
    return getSystemSetting('ENABLE_COLOR_NOTIFICATIONS', true);
}
