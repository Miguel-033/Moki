// Обновлённый bot.js
const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");
require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const API_BASE_URL = "https://moki-bd.onrender.com";

let selectedLevel = null;
let selectedTales = [];

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

bot.start((ctx) => {
  selectedLevel = null;
  ctx.reply(
    `👋 Привет, ${ctx.from.first_name || "друг"}!
\n` +
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
  selectedLevel = ctx.match[1].toUpperCase();
  ctx.reply(
    `✅ Уровень ${ctx.match[1]} выбран. Открываю главное меню…`,
    mainMenuKeyboard
  );
});

bot.hears("⬅️ Назад", (ctx) => {
  ctx.reply("🔙 Вернись назад и выбери уровень", levelKeyboard);
  selectedLevel = null;
});

bot.hears("🏰 Сказки", async (ctx) => {
  if (!selectedLevel) {
    return ctx.reply("❗ Сначала выбери уровень", levelKeyboard);
  }

  try {
    const res = await axios.get(`${API_BASE_URL}/fairy-tales`);
    selectedTales = res.data.filter(
      (tale) => tale.level.toUpperCase() === selectedLevel
    );

    if (selectedTales.length === 0) {
      return ctx.reply("📭 Пока нет сказок для этого уровня.");
    }

    const taleTitles = selectedTales.map((t) => [t.title]);
    ctx.reply(
      "📚 Выбери сказку:",
      Markup.keyboard([...taleTitles, ["⬅️ Назад"]]).resize()
    );
  } catch (err) {
    console.error("Ошибка при получении сказок:", err.message);
    ctx.reply("🚫 Не удалось получить сказки. Попробуй позже.");
  }
});

bot.hears("📘 Рассказы", (ctx) => ctx.reply("📖 Список рассказов…"));
bot.hears("⏳ Времена", (ctx) => ctx.reply("⏳ Времена испанского языка…"));
bot.hears("❤️ Избранное", (ctx) => ctx.reply("❤️ Твои избранные истории…"));
bot.hears("🙏 Поддержать", (ctx) => {
  ctx.reply(`🙏 Поддержать проект\n👉 https://boosty.to/yourpage`);
});

bot.on("text", async (ctx) => {
  const title = ctx.message.text;
  const tale = selectedTales.find((t) => t.title === title);

  if (tale) {
    return ctx.reply(
      `📖 Что ты хочешь сделать с «${tale.title}»?`,
      Markup.inlineKeyboard([
        [Markup.button.callback("📖 Читать", `read_${tale.id}`)],
        [Markup.button.callback("🔊 Слушать", `listen_${tale.id}`)],
      ])
    );
  }
});

bot.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data.startsWith("read_")) {
    const id = parseInt(data.split("_")[1]);
    const tale = selectedTales.find((t) => t.id === id);
    if (tale) {
      await ctx.reply(`📖 ${tale.title}\n\n${tale.text}`);
    }
  } else if (data.startsWith("listen_")) {
    const id = parseInt(data.split("_")[1]);
    const tale = selectedTales.find((t) => t.id === id);
    if (tale) {
      await ctx.replyWithAudio(tale.audio_url);
    }
  }
  await ctx.answerCbQuery();
});

module.exports = bot;
