function testSystemSetup() {
    console.log("Тестирование системы...");

    const testMessage = `CLASP DEPLOY TEST\n\n` +
        `Time: ${new Date().toLocaleString('ru-RU')}\n` +
        `Connection: Google Sheets + Clasp CLI\n` +
        `Status: COMPLETED`;

    sendTelegramMessage(testMessage);
}
