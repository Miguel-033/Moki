const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");

const bot = new Telegraf(process.env.BOT_TOKEN);
const API_URL = process.env.API_URL || "http://localhost:5000"; // или ваш Render URL

bot.use((ctx, next) => {
  console.log("📩 Update:", ctx.update);
  return next();
});

const levelKeyboard = Markup.keyboard([
  ["🇪🇸 Уровень A1", "🇪🇸 Уровень A2"],
  ["🇪🇸 Уровень B1", "🇪🇸 Уровень B2"],
]).resize();

const mainMenuKeyboard = Markup.keyboard([
  ["🏰 Сказки", "📘 Рассказы"],
  ["⏳ Времена", "❤️ Избранное"],
  ["🙏 Поддержать", "⬅️ Назад"],
]).resize();

let userLevels = {};

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

bot.hears(/Уровень (A1|A2|B1|B2)/, (ctx) => {
  const level = ctx.match[1];
  userLevels[ctx.from.id] = level.toLowerCase();
  ctx.reply(
    `✅ Уровень ${level} выбран. Открываю главное меню…`,
    mainMenuKeyboard
  );
});

bot.hears("🏰 Сказки", async (ctx) => {
  const level = userLevels[ctx.from.id];
  if (!level) {
    return ctx.reply("❗ Сначала выбери уровень", levelKeyboard);
  }

  try {
    const response = await axios.get(
      `${API_URL}/api/fairy-tales?level=${level}`
    );
    const tales = response.data;

    if (tales.length === 0) {
      return ctx.reply("😕 Для этого уровня пока нет сказок.");
    }

    for (const tale of tales) {
      const caption = `📖 *${tale.title}*\n\n${tale.text}`;
      await ctx.replyWithAudio(
        { url: tale.audio_url },
        {
          caption,
          parse_mode: "Markdown",
        }
      );
    }
  } catch (error) {
    console.error("Ошибка при получении сказок:", error.message);
    ctx.reply("⚠️ Не удалось загрузить сказки. Попробуй позже.");
  }
});

bot.hears("📘 Рассказы", (ctx) => ctx.reply("📖 Список рассказов…"));
bot.hears("⏳ Времена", (ctx) => ctx.reply("⏳ Времена испанского языка…"));
bot.hears("❤️ Избранное", (ctx) => ctx.reply("❤️ Твои избранные истории…"));
bot.hears("🙏 Поддержать", (ctx) =>
  ctx.reply(`🙏 Поддержать проект\n👉 https://boosty.to/yourpage`)
);
bot.hears("⬅️ Назад", (ctx) =>
  ctx.reply("↩️ Назад в главное меню", mainMenuKeyboard)
);

module.exports = bot;
