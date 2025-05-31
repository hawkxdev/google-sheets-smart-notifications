# Google Sheets Smart Notifications

## Описание проекта

Мониторинг изменений в Google Таблицах с уведомлениями через Telegram.

## Технический стек

### **Основные технологии:**
- **Google Apps Script** - основная логика, триггеры onChange/onEdit
- **Google Sheets API** - работа с таблицами, цветовые индикаторы
- **Telegram Bot API** - отправка уведомлений, обработка ошибок
- **JavaScript ES6+** - современный синтаксис, JSDoc документация

### **DevOps инструменты:**
- **Google Clasp CLI** - локальная разработка и автоматический деплой
- **VSCode** - основная IDE с IntelliSense для Google Apps Script
- **Git** - версионирование кода с историей разработки
- **Node.js** - runtime для Google Clasp

### **Архитектура:**
- **Модульная структура** - 7 независимых модулей в `src/`
- **Installable триггеры** - программное создание onEdit событий
- **Централизованная конфигурация** - `config.js` с токенами и настройками
- **Обработка ошибок** - try-catch блоки для всех внешних API

### **Интеграции:**
- **@BotFather** - создание и управление Telegram ботом
- **Google Cloud Console** - Google Apps Script проекты и API доступы
- **Telegram Bot API v6.0** - отправка сообщений и файлов

**Статус проекта:** Цветовые индикаторы работают | Детектор новых записей в разработке  
**Автор:** hawkxdev  
**DevOps workflow:** VSCode → `clasp push` → Google Apps Script → Telegram  
