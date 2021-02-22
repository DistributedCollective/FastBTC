import Telegram from 'telegraf/telegram';
import conf from '../config/config';

class TelegramBot {
    constructor() {
        this.bot = conf.errorBotTelegram ? new Telegram(conf.errorBotTelegram) : null;
    }

    sendInfoNotification(msg) {
        try {
            console.log(msg)
            this.bot.sendMessage(conf.telegramGroupId, msg);
        } catch(err) {
            console.log(err)
        }
    }

    sendErrorNotification(msg) {
        try {
            console.log(msg)
            this.bot.sendMessage(conf.telegramGroupId, msg);
        } catch(err) {
            console.log(err)
        }
    }
}

export default new TelegramBot()
