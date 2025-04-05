require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");

// Получаем токен из .env
const bot = new Telegraf(process.env.BOT_TOKEN);

// Меню уровней (A1-B2)
const levelKeyboard = Markup.keyboard([
  ["🇪🇸 Уровень A1", "🇪🇸 Уровень A2"],
  ["🇪🇸 Уровень B1", "🇪🇸 Уровень B2"],
]).resize();

// Главное меню
const mainMenuKeyboard = Markup.keyboard([
  ["🏰 Сказки", "📘 Рассказы"],
  ["⏳ Времена", "❤️ Избранное"],
  ["🙏 Поддержать", "⬅️ Назад"],
]).resize();

// Старт
bot.start((ctx) => {
  ctx.reply(
    `👋 Привет, ${ctx.from.first_name || "друг"}!\n\n` +
      `Я — бот *Moki* для изучения испанского через сказки и рассказы.\n` +
      `📖 Читай и слушай адаптированные истории по уровням A1–B2.\n\n` +
      `💖 Поддержи проект командой /donate\n\n` +
      `Выбери свой уровень 👇`,
    {
      parse_mode: "Markdown",
      ...levelKeyboard,
    }
  );
});

// Выбор уровня
bot.hears(/Уровень (A1|A2|B1|B2)/, (ctx) => {
  const level = ctx.match[1];
  ctx.session = { ...ctx.session, level };
  ctx.reply(
    `✅ Уровень ${level} выбран. Открываю главное меню…`,
    mainMenuKeyboard
  );
});

// Заглушки для меню
bot.hears("🏰 Сказки", (ctx) => ctx.reply("📚 Список сказок…"));
bot.hears("📘 Рассказы", (ctx) => ctx.reply("📖 Список рассказов…"));
bot.hears("⏳ Времена", (ctx) => ctx.reply("⏳ Времена испанского языка…"));
bot.hears("❤️ Избранное", (ctx) => ctx.reply("❤️ Твои избранные истории…"));
bot.hears("🙏 Поддержать", (ctx) => {
  ctx.reply(
    `🙏 Поддержать проект\n` +
      `Если бот помогает тебе в изучении испанского — поддержи его развитие.\n\n` +
      `👉 Донаты: https://boosty.to/yourpage`
  );
});
bot.hears("⬅️ Назад", (ctx) =>
  ctx.reply("↩️ Назад в главное меню", mainMenuKeyboard)
);

// Запуск бота
bot.launch();
console.log("🤖 Бот запущен");

// Обработка ошибок и завершения
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
