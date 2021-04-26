class LoggingUtil {
    constructor() {
        // stores unknown labels => the times we've complained about them
        this.lastMessages = new Map();
    }

    logUnique(location, message, resendSeconds = 60) {
        let entry = this.lastMessages.get(location);
        const time = Date.now();
        if (! entry || entry.message !== message || entry.timeout < time) {
            console.log(message);
            this.lastMessages.set(location, {
                message,
                timeout: Date.now() + resendSeconds * 1000
            });
        }
    }
}

export default new LoggingUtil();
