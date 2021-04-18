import BaseModel from './baseModel';

export default class Bookmarks extends BaseModel {
    constructor(db) {
        const sql = `
            CREATE TABLE IF NOT EXISTS bookmarks
            (
                key   text primary key,
                value text
            )
        `;

        super(db, 'bookmarks', sql);
    }

    async getBookmark(key, defaultValue) {
        const res = await this.get(`SELECT value
                                    FROM ${this.tableName}
                                    WHERE key = ?`,
            [key]
        );

        if (!res) {
            if (defaultValue === undefined) {
                console.error(`key ${key} does not have value in db and no default was provided`);
                throw new Error(`key ${key} does not have value in db and no default was provided`);
            }

            return defaultValue;
        }

        return res.value;
    }

    async setBookmark(key, value) {
        await this.run(`
            INSERT OR REPLACE 
            INTO ${this.tableName} (key, value)
            VALUES (?, ?)
        `, [key, value]);
    }
};
