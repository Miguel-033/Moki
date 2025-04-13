const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");
const bot = new Telegraf(process.env.BOT_TOKEN);

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:5000";

// Логируем все апдейты
bot.use((ctx, next) => {
  console.log("📩 Update:", ctx.update);
  return next();
});

// Клавиатуры
const levelKeyboard = Markup.keyboard([
  ["🇪🇸 Уровень A1", "🇪🇸 Уровень A2"],
  ["🇪🇸 Уровень B1", "🇪🇸 Уровень B2"],
]).resize();

const mainMenuKeyboard = Markup.keyboard([
  ["🏰 Сказки", "📘 Рассказы"],
  ["⏳ Времена", "❤️ Избранное"],
  ["🙏 Поддержать", "⬅️ Назад"],
]).resize();

// Команда /start
bot.start((ctx) => {
  ctx.reply(
    `👋 Привет, ${ctx.from.first_name || "друг"}!

Я — бот *Moki* для изучения испанского через сказки и рассказы.
📖 Читай и слушай адаптированные истории по уровням A1–B2.

💖 Поддержи проект командой /donate

Выбери свой уровень 👇`,
    {
      parse_mode: "Markdown",
      ...levelKeyboard,
    }
  );
});

// Обработка выбора уровня
bot.hears(/Уровень (A1|A2|B1|B2)/, (ctx) => {
  const level = ctx.match[1];
  ctx.session = { ...ctx.session, level };
  ctx.reply(
    `✅ Уровень ${level} выбран. Открываю главное меню…`,
    mainMenuKeyboard
  );
});

// Запрос сказок
bot.hears("🏰 Сказки", async (ctx) => {
  const level = ctx.session?.level;
  if (!level) {
    return ctx.reply("❗ Сначала выбери уровень");
  }

  try {
    const response = await axios.get(
      `${API_BASE_URL}/fairy-tales?level=${level.toLowerCase()}`
    );
    const stories = response.data;

    if (!stories.length) {
      return ctx.reply("⚠️ Для этого уровня пока нет сказок.");
    }

    for (const story of stories) {
      await ctx.replyWithAudio(
        {
          url: story.audio_url,
          title: story.title,
        },
        {
          caption: `📖 ${story.title}\n\n${story.text}`,
        }
      );
    }
  } catch (err) {
    console.error("Ошибка при загрузке сказок:", err);
    ctx.reply("🚫 Не удалось получить сказки. Попробуй позже.");
  }
});

// Остальные обработчики
bot.hears("📘 Рассказы", (ctx) => ctx.reply("📖 Список рассказов…"));
bot.hears("⏳ Времена", (ctx) => ctx.reply("⏳ Времена испанского языка…"));
bot.hears("❤️ Избранное", (ctx) => ctx.reply("❤️ Твои избранные истории…"));
bot.hears("🙏 Поддержать", (ctx) => {
  ctx.reply(`🙏 Поддержать проект\n👉 https://boosty.to/yourpage`);
});
bot.hears("⬅️ Назад", (ctx) =>
  ctx.reply("↩️ Назад в главное меню", mainMenuKeyboard)
);

module.exports = bot;
