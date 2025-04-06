const { Telegraf, Markup } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use((ctx, next) => {
  console.log('📩 Update:', ctx.update);
  return next();
});

const levelKeyboard = Markup.keyboard([
  ['🇪🇸 Уровень A1', '🇪🇸 Уровень A2'],
  ['🇪🇸 Уровень B1', '🇪🇸 Уровень B2']
]).resize();

const mainMenuKeyboard = Markup.keyboard([
  ['🏰 Сказки', '📘 Рассказы'],
  ['⏳ Времена', '❤️ Избранное'],
  ['🙏 Поддержать', '⬅️ Назад']
]).resize();

bot.start((ctx) => {
  ctx.reply(
    `👋 Привет, ${ctx.from.first_name || 'друг'}!

` +
    `Я — бот *Moki* для изучения испанского через сказки и рассказы.
` +
    `📖 Читай и слушай адаптированные истории по уровням A1–B2.

` +
    `💖 Поддержи проект командой /donate

` +
    `Выбери свой уровень 👇`,
    {
      parse_mode: 'Markdown',
      ...levelKeyboard
    }
  );
});

bot.hears(/Уровень (A1|A2|B1|B2)/, (ctx) => {
  const level = ctx.match[1];
  ctx.reply(`✅ Уровень ${level} выбран. Открываю главное меню…`, mainMenuKeyboard);
});

bot.hears('🏰 Сказки', (ctx) => ctx.reply('📚 Список сказок…'));
bot.hears('📘 Рассказы', (ctx) => ctx.reply('📖 Список рассказов…'));
bot.hears('⏳ Времена', (ctx) => ctx.reply('⏳ Времена испанского языка…'));
bot.hears('❤️ Избранное', (ctx) => ctx.reply('❤️ Твои избранные истории…'));
bot.hears('🙏 Поддержать', (ctx) => {
  ctx.reply(`🙏 Поддержать проект
👉 https://boosty.to/yourpage`);
});
bot.hears('⬅️ Назад', (ctx) => ctx.reply('↩️ Назад в главное меню', mainMenuKeyboard));

module.exports = bot;