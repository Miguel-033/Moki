// const { Telegraf, Markup } = require("telegraf");
// const axios = require("axios");
// require("dotenv").config();

// const bot = new Telegraf(process.env.BOT_TOKEN);
// const API_BASE_URL = "https://moki-bd.onrender.com";

// let selectedLevel = null;

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
//   selectedLevel = null;
//   ctx.reply(
//     `👋 Привет, ${ctx.from.first_name || "друг"}!\n\n` +
//       `Я — бот *Moki* для изучения испанского через сказки и рассказы.\n` +
//       `📖 Читай и слушай адаптированные истории по уровням A1–B2.\n\n` +
//       `💖 Поддержи проект командой /donate\n\n` +
//       `Выбери свой уровень 👇`,
//     {
//       parse_mode: "Markdown",
//       ...levelKeyboard,
//     }
//   );
// });

// bot.hears(/Уровень (A1|A2|B1|B2)/, (ctx) => {
//   selectedLevel = ctx.match[1].toUpperCase(); // ✅ Теперь всегда A1, A2 и т.д.
//   ctx.reply(
//     `✅ Уровень ${ctx.match[1]} выбран. Открываю главное меню…`,
//     mainMenuKeyboard
//   );
// });

// bot.hears("🏰 Сказки", async (ctx) => {
//   if (!selectedLevel) {
//     return ctx.reply("❗ Сначала выбери уровень", levelKeyboard);
//   }

//   try {
//     const res = await axios.get(`${API_BASE_URL}/fairy-tales`);
//     const tales = res.data.filter(
//       (tale) => tale.level.toUpperCase() === selectedLevel // ✅ Сравнение в верхнем регистре
//     );

//     if (tales.length === 0) {
//       return ctx.reply("📭 Пока нет сказок для этого уровня.");
//     }

//     for (const tale of tales) {
//       await ctx.replyWithAudio(tale.audio_url, {
//         caption: `📖 ${tale.title}\n\n${tale.text}`,
//       });
//     }
//   } catch (err) {
//     console.error("Ошибка при получении сказок:", err.message);
//     ctx.reply("🚫 Не удалось получить сказки. Попробуй позже.");
//   }
// });

// bot.hears("📘 Рассказы", (ctx) => ctx.reply("📖 Список рассказов…"));
// bot.hears("⏳ Времена", (ctx) => ctx.reply("⏳ Времена испанского языка…"));
// bot.hears("❤️ Избранное", (ctx) => ctx.reply("❤️ Твои избранные истории…"));
// bot.hears("🙏 Поддержать", (ctx) => {
//   ctx.reply(`🙏 Поддержать проект\n👉 https://boosty.to/yourpage`);
// });
// bot.hears("⬅️ Назад", (ctx) =>
//   ctx.reply("↩️ Назад в главное меню", mainMenuKeyboard)
// );

// module.exports = bot;

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
  ["🙏 Поддержать", "⬅️ Назад"],
]).resize();

bot.start((ctx) => {
  selectedLevel = null;
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
  selectedLevel = ctx.match[1].toLowerCase();
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
    const res = await axios.get(`${API_BASE_URL}/fairy-tales`);
    const tales = res.data;

    if (tales.length === 0) {
      return ctx.reply("📭 Пока нет сказок.");
    }

    for (const tale of tales) {
      await ctx.replyWithAudio(tale.audio_url, {
        caption: `📖 ${tale.title}\n\n${tale.text}`,
      });
    }
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
bot.hears("⬅️ Назад", (ctx) =>
  ctx.reply("↩️ Назад в главное меню", mainMenuKeyboard)
);

module.exports = bot;
