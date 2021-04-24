import Telegram from 'telegraf/telegram';
import conf from '../config/config';

class TelegramBot {
    constructor() {
        this.bot = conf.telegramBot ? new Telegram(conf.telegramBot) : null;
        if (!this.bot) {
            console.info("You don't have your telegram bot set up");
        }
    }

    sendMessage(msg) {
        if (this.bot) {
            console.log(msg);
            this.bot.sendMessage(conf.telegramGroupId, msg)
               .catch(e => console.log(e));
        }
    }
}

export default new TelegramBot()
