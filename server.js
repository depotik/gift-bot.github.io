import { Telegraf } from "telegraf";

const BOT_TOKEN = process.env.BOT_TOKEN; // токен от @BotFather
const SITE_TOKEN = process.env.SITE_TOKEN || "mZp9sK4wQ2Lr8eB7"; // придумай сам
const WEBAPP_URL = "https://depotik.github.io/gift-bot.github.io"; // твой фронт

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
    ctx.reply(
        "Привет! Жми кнопку, чтобы открыть WebApp.",
        {
            reply_markup: {
                keyboard: [
                    [
                        {
                            text: "🎁 Открыть подарок",
                            web_app: { url: `${WEBAPP_URL}?token=${SITE_TOKEN}` }
                        }
                    ]
                ],
                resize_keyboard: true
            }
        }
    );
});

bot.launch();
