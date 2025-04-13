const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");
require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const API_BASE_URL = "https://moki-bd.onrender.com";

let selectedLevel = null;

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
  ["🙏 Поддержать", "🔄 Сменить уровень"],
]).resize();

bot.start((ctx) => {
  selectedLevel = null;
  ctx.reply(
    `👋 Привет, ${ctx.from.first_name || "друг"}!

` +
      `Я — бот *Moki* для изучения испанского через сказки и рассказы.
` +
      `📖 Читай и слушай адаптированные истории по уровням A1–B2.

` +
      `💖 Поддержи проект командой /donate

` +
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

bot.hears("🔄 Сменить уровень", (ctx) => {
  selectedLevel = null;
  ctx.reply("🔁 Пожалуйста, выбери новый уровень:", levelKeyboard);
});

bot.hears("🏰 Сказки", async (ctx) => {
  if (!selectedLevel) {
    return ctx.reply("❗ Сначала выбери уровень", levelKeyboard);
  }

  try {
    const res = await axios.get(`${API_BASE_URL}/fairy-tales`);
    const tales = res.data.filter(
      (tale) => tale.level.toUpperCase() === selectedLevel
    );

    if (tales.length === 0) {
      return ctx.reply("📭 Пока нет сказок для этого уровня.");
    }

    const buttons = tales.map((tale) => [
      Markup.button.callback(tale.title, `TALE_${tale.id}`),
    ]);
    ctx.reply("📚 Вот список сказок:", Markup.inlineKeyboard(buttons));
  } catch (err) {
    console.error("Ошибка при получении сказок:", err.message);
    ctx.reply("🚫 Не удалось получить сказки. Попробуй позже.");
  }
});

bot.action(/TALE_(\d+)/, async (ctx) => {
  const taleId = ctx.match[1];
  try {
    const res = await axios.get(`${API_BASE_URL}/fairy-tales`);
    const tale = res.data.find((t) => t.id === parseInt(taleId));

    if (!tale) return ctx.reply("❌ Сказка не найдена.");

    ctx.reply(
      `Выбрана сказка: *${tale.title}*\n\nВыберите действие:`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback("📖 Читать", `READ_${tale.id}`),
          Markup.button.callback("🔊 Слушать", `LISTEN_${tale.id}`),
        ],
        [Markup.button.callback("⬅️ Назад", "BACK_TO_LIST")],
      ]).extra({ parse_mode: "Markdown" })
    );
  } catch (err) {
    ctx.reply("🚫 Не удалось загрузить сказку.");
  }
});

bot.action("BACK_TO_LIST", async (ctx) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/fairy-tales`);
    const tales = res.data.filter(
      (t) => t.level.toUpperCase() === selectedLevel
    );

    const buttons = tales.map((tale) => [
      Markup.button.callback(tale.title, `TALE_${tale.id}`),
    ]);
    ctx.editMessageText(
      "📚 Вот список сказок:",
      Markup.inlineKeyboard(buttons)
    );
  } catch (err) {
    ctx.reply("🚫 Не удалось вернуть список сказок.");
  }
});

bot.action(/READ_(\d+)/, async (ctx) => {
  const taleId = ctx.match[1];
  try {
    const res = await axios.get(`${API_BASE_URL}/fairy-tales`);
    const tale = res.data.find((t) => t.id === parseInt(taleId));
    ctx.replyWithMarkdown(`📖 *${tale.title}*\n\n${tale.text}`);
  } catch (err) {
    ctx.reply("❌ Ошибка при отображении текста.");
  }
});

bot.action(/LISTEN_(\d+)/, async (ctx) => {
  const taleId = ctx.match[1];
  try {
    const res = await axios.get(`${API_BASE_URL}/fairy-tales`);
    const tale = res.data.find((t) => t.id === parseInt(taleId));
    await ctx.replyWithAudio(tale.audio_url, { caption: `🎧 ${tale.title}` });
  } catch (err) {
    ctx.reply("❌ Не удалось воспроизвести аудио.");
  }
});

bot.hears("📘 Рассказы", (ctx) => ctx.reply("📖 Список рассказов…"));
bot.hears("⏳ Времена", (ctx) => ctx.reply("⏳ Времена испанского языка…"));
bot.hears("❤️ Избранное", (ctx) => ctx.reply("❤️ Твои избранные истории…"));
bot.hears("🙏 Поддержать", (ctx) => {
  ctx.reply(`🙏 Поддержать проект\n👉 https://boosty.to/yourpage`);
});
