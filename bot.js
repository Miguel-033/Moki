const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");
require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const API_BASE_URL = "https://moki-bd.onrender.com";
const START_IMAGE_URL = "https://moki-img.vercel.app/moki-avatar.png";

let selectedLevel = null;
const userSession = new Map();

const levelKeyboard = Markup.keyboard([
  ["🇪🇸 Уровень A1", "🇪🇸 Уровень A2"],
  ["🇪🇸 Уровень B1", "🇪🇸 Уровень B2"],
]).resize();

const mainMenuKeyboard = Markup.keyboard([
  ["🏰 Сказки", "📘 Рассказы"],
  ["⏳ Времена", "❤️ Избранное"],
  ["🙏 Поддержать", "ℹ️ Сменить уровень"],
]).resize();

// 🔵 Функция для пробуждения сервера
async function ensureServerAwake() {
  try {
    await axios.get(`${API_BASE_URL}/`);
    console.log("✅ Сервер успешно пинганут");
  } catch (error) {
    console.error("⚠️ Ошибка пробуждения сервера:", error.message);
  }
}

bot.start(async (ctx) => {
  selectedLevel = null;
  await ctx.replyWithPhoto(
    { url: START_IMAGE_URL },
    {
      caption: "👋 Я — бот Moki. Нажми на кнопку ниже, чтобы начать!",
      ...Markup.inlineKeyboard([
        [Markup.button.callback("👋 Привет, Moki", "SAY_HELLO")],
      ]),
    }
  );
});

bot.action("SAY_HELLO", async (ctx) => {
  await ctx.editMessageReplyMarkup(); // убираем кнопки
  await ctx.reply(
    `👋 Привет, ${ctx.from.first_name || "друг"}!\n\n` +
      `Я — бот *Moki* для изучения испанского через сказки и рассказы.\n` +
      `📖 Читай и слушай адаптированные истории по уровням A1–B2.\n\n` +
      `Выбери свой уровень 👇`,
    {
      parse_mode: "Markdown",
      ...levelKeyboard,
    }
  );
});

bot.hears(/Уровень (A1|A2|B1|B2)/, (ctx) => {
  selectedLevel = ctx.match[1].toUpperCase();
  userSession.set(ctx.from.id, { selectedTale: null, tales: [] });
  ctx.reply(
    `✅ Уровень ${ctx.match[1]} выбран. Открываю главное меню…`,
    mainMenuKeyboard
  );
});

bot.hears("🏰 Сказки", async (ctx) => {
  if (!selectedLevel) {
    return ctx.reply("❗ Сначала выбери уровень", levelKeyboard);
  }

  try {
    // 1. Сообщение о загрузке
    await ctx.reply("⏳ Пожалуйста, подождите, загружаю список сказок...");

    // 2. Пингуем сервер
    await ensureServerAwake();

    // 3. Загружаем сказки
    const res = await axios.get(`${API_BASE_URL}/fairy-tales`);
    const tales = res.data.filter(
      (t) => t.level.toUpperCase() === selectedLevel
    );

    if (tales.length === 0) {
      return ctx.reply("📭 Пока нет сказок для этого уровня.");
    }

    userSession.get(ctx.from.id).tales = tales;

    ctx.reply(
      "📚 Вот список сказок:",
      Markup.inlineKeyboard(
        tales.map((t) => [Markup.button.callback(t.title, `TALE_${t.slug}`)])
      )
    );
  } catch (err) {
    console.error("Ошибка при получении сказок:", err.message);
    ctx.reply("🚫 Не удалось получить сказки. Попробуй позже.");
  }
});

bot.action(/^TALE_(.+)/, async (ctx) => {
  const slug = ctx.match[1];
  const session = userSession.get(ctx.from.id);
  const tale = session?.tales.find((t) => t.slug === slug);
  if (!tale) return ctx.answerCbQuery("Сказка не найдена");

  session.selectedTale = tale;

  await ctx.reply(`🌍 *${tale.title}*`, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [Markup.button.callback("📖 Читать", "READ")],
      [Markup.button.callback("🔊 Слушать", "LISTEN")],
      [Markup.button.callback("⬅️ Назад", "BACK_TO_LIST")],
    ]),
  });
});

bot.action("READ", (ctx) => {
  const tale = userSession.get(ctx.from.id)?.selectedTale;
  if (!tale) return ctx.answerCbQuery("Сказка не выбрана");
  ctx.reply(`📖 ${tale.title}\n\n${tale.text}`);
});

bot.action("LISTEN", (ctx) => {
  const tale = userSession.get(ctx.from.id)?.selectedTale;
  if (!tale?.audio_url) return ctx.answerCbQuery("Аудио недоступно");
  ctx.replyWithVoice({ url: tale.audio_url });
});

bot.action("BACK_TO_LIST", (ctx) => {
  const tales = userSession.get(ctx.from.id)?.tales || [];
  ctx.reply(
    "📚 Список сказок:",
    Markup.inlineKeyboard(
      tales.map((t) => [Markup.button.callback(t.title, `TALE_${t.slug}`)])
    )
  );
});

bot.hears("📘 Рассказы", (ctx) => ctx.reply("📖 Список рассказов…"));
bot.hears("⏳ Времена", (ctx) => ctx.reply("⏳ Времена испанского языка…"));
bot.hears("❤️ Избранное", (ctx) => ctx.reply("❤️ Твои избранные истории…"));
bot.hears("🙏 Поддержать", (ctx) =>
  ctx.reply("🙏 Поддержать проект\n👉 https://boosty.to/yourpage")
);
bot.hears("ℹ️ Сменить уровень", (ctx) => {
  selectedLevel = null;
  userSession.delete(ctx.from.id);
  ctx.reply("🔁 Выбери новый уровень:", levelKeyboard);
});

module.exports = bot;
