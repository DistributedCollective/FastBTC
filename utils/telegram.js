import Telegram from 'telegraf/telegram';
import conf from '../config/config';

class TelegramBot {
    constructor() {
        this.bot = conf.telegramBot ? new Telegram(conf.telegramBot) : null;
    }

    sendMessage(msg) {
        if (this.bot) {
            try {
                console.log(msg)
                this.bot.sendMessage(conf.telegramGroupId, msg);
            } catch(err) {
                console.log(err)
            }
        } else {
            console.info("You don't have your telegram bot setup")
        }
    }
}

export default new TelegramBot()
