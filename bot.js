// const { Telegraf, Markup } = require("telegraf");
// const bot = new Telegraf(process.env.BOT_TOKEN);

// bot.use((ctx, next) => {
//   console.log("📩 Update:", ctx.update);
//   return next();
// });

// const levelKeyboard = Markup.keyboard([
//   ["🇪🇸 Уровень A1", "🇪🇸 Уровень A2"],
//   ["🇪🇸 Уровень B1", "🇪🇸 Уровень B2"],
// ]).resize();

// const mainMenuKeyboard = Markup.keyboard([
//   ["🏰 Сказки", "📘 Рассказы"],
//   ["⏳ Времена", "❤️ Избранное"],
//   ["🙏 Поддержать", "⬅️ Назад"],
// ]).resize();

// bot.start((ctx) => {
//   ctx.reply(
//     `👋 Привет, ${ctx.from.first_name || "друг"}!

// ` +
//       `Я — бот *Moki* для изучения испанского через сказки и рассказы.
// ` +
//       `📖 Читай и слушай адаптированные истории по уровням A1–B2.

// ` +
//       `💖 Поддержи проект командой /donate

// ` +
//       `Выбери свой уровень 👇`,
//     {
//       parse_mode: "Markdown",
//       ...levelKeyboard,
//     }
//   );
// });

// bot.hears(/Уровень (A1|A2|B1|B2)/, (ctx) => {
//   const level = ctx.match[1];
//   ctx.reply(
//     `✅ Уровень ${level} выбран. Открываю главное меню…`,
//     mainMenuKeyboard
//   );
// });

// bot.hears("🏰 Сказки", (ctx) => ctx.reply("📚 Список сказок…"));
// bot.hears("📘 Рассказы", (ctx) => ctx.reply("📖 Список рассказов…"));
// bot.hears("⏳ Времена", (ctx) => ctx.reply("⏳ Времена испанского языка…"));
// bot.hears("❤️ Избранное", (ctx) => ctx.reply("❤️ Твои избранные истории…"));
// bot.hears("🙏 Поддержать", (ctx) => {
//   ctx.reply(`🙏 Поддержать проект
// 👉 https://boosty.to/yourpage`);
// });
// bot.hears("⬅️ Назад", (ctx) =>
//   ctx.reply("↩️ Назад в главное меню", mainMenuKeyboard)
// );

// module.exports = bot;

const { Telegraf, Markup } = require("telegraf");
const fetch = require("node-fetch");

const bot = new Telegraf(process.env.BOT_TOKEN);

const userLevels = {}; // Telegram ID → выбранный уровень
const userSelections = {}; // Telegram ID → выбранная сказка

// Клавиатура выбора уровня
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

bot.start((ctx) => {
  ctx.reply(
    `👋 Привет, ${ctx.from.first_name || "друг"}!\n\n` +
      `Я — бот *Moki* для изучения испанского через сказки и рассказы.\n` +
      `📖 Читай и слушай адаптированные истории по уровням A1–B2.\n\n` +
      `Выбери свой уровень 👇`,
    { parse_mode: "Markdown", ...levelKeyboard }
  );
});

bot.hears(/Уровень (A1|A2|B1|B2)/, (ctx) => {
  const level = ctx.match[1];
  userLevels[ctx.from.id] = level;
  ctx.reply(`✅ Уровень ${level} выбран.`, mainMenuKeyboard);
});

bot.hears("🏰 Сказки", async (ctx) => {
  const level = userLevels[ctx.from.id];
  if (!level) return ctx.reply("📌 Сначала выбери уровень!", levelKeyboard);

  const apiUrl = `https://api.github.com/repos/Miguel-033/moki-content/contents/content/${level}/сказки`;

  try {
    const res = await fetch(apiUrl);
    const files = await res.json();

    const dirs = files.filter((item) => item.type === "dir");

    if (!dirs.length) return ctx.reply("❌ Пока нет доступных сказок.");

    const buttons = dirs.map((dir) => [
      Markup.button.callback(dir.name, `story_${dir.name}`),
    ]);

    ctx.reply("📚 Выбери сказку:", Markup.inlineKeyboard(buttons));
  } catch (err) {
    console.error("Ошибка GitHub API:", err);
    ctx.reply("❌ Не удалось загрузить список сказок.");
  }
});

bot.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery.data;
  const userId = ctx.from.id;
  const level = userLevels[userId];

  if (data.startsWith("story_")) {
    const storyId = data.replace("story_", "");
    userSelections[userId] = { storyId, level };

    return ctx.reply(
      "📖 Что хочешь сделать?",
      Markup.inlineKeyboard([
        [Markup.button.callback("📖 Читать", "read")],
        [Markup.button.callback("🔊 Слушать", "listen")],
      ])
    );
  }

  if (data === "read" || data === "listen") {
    const { storyId, level } = userSelections[userId] || {};
    if (!storyId || !level) return ctx.reply("⚠️ История не выбрана.");

    const url = `https://raw.githubusercontent.com/Miguel-033/moki-content/main/content/${level}/сказки/${storyId}/data.json`;

    try {
      const res = await fetch(url);
      const story = await res.json();

      if (data === "read") {
        await ctx.reply(`📖 *${story.title}*\n\n${story.text}`, {
          parse_mode: "Markdown",
        });
      } else {
        await ctx.replyWithAudio({ url: story.audio }, { title: story.title });
      }
    } catch (err) {
      console.error("Ошибка при загрузке data.json:", err);
      ctx.reply("❌ Не удалось загрузить сказку.");
    }
  }
});

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
