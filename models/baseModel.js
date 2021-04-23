import _ from 'lodash';

export default class BaseModel {
    constructor (db, tableName) {
        this.db = db;
        this.tableName = tableName;
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Error running sql ' + sql);
                    console.error(err);
                    reject(err);
                }
                else {
                    resolve( { id: this.lastID } );
                }
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Error running sql: ' + sql);
                    console.error(err);
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, result) => {
                if (err) {
                    console.error('Error running sql: ' + sql);
                    console.error(err);
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
        });
    }

    async checkTable() {
        try {
            console.log("checking %s table", this.tableName);
            await this.run(`SELECT * FROM ${this.tableName}`);
        }
        catch (e) {
            console.error(
                `database failed sanity check - table ${tableName} not selectable`, err
            );
            process.exit(1);
        }
    }

    /**
     *
     * @param {object} criteria - query object for finding a user
     */
    findOne(criteria) {
        const params = _.values(criteria);
        const where = _.keys(criteria).map(k => `${k} = ?`).join(' AND ');
        const sql = `SELECT *FROM ${this.tableName} WHERE ${where}`;

        return this.get(sql, params);
    }

    /**
     * Find list of users by some criteria
     * @param criteria
     * @param limit
     * @param offset
     * @param orderBy
     */
    find(criteria, {limit, offset, orderBy} = {}) {
        let sql = `SELECT * FROM ${this.tableName}`;

        if (_.size(criteria) > 0) {
            const where = _.keys(criteria).map(k => {
                const val = criteria[k];

                if (val != null && typeof val === 'object' && val.length != null) {
                    const list = val.map(el => typeof el === 'string' ? `'${el}'` : el).join(',');
                    delete criteria[k];
                    return k + ' IN(' + list + ')';
                } else {
                    return `${k} = ?`;
                }
            }).join(' AND ');
            sql += ' WHERE ' + where;
        }

        if (_.size(orderBy) > 0) {
            sql += ' ORDER BY ' + _.keys(orderBy).map(f => f + ' ' + (orderBy[f] > 0 ? 'ASC' : 'DESC')).join(', ');
        }

        if (limit > 0) {
            sql += ' LIMIT ' + limit;
        }
        if (offset > 0) {
            sql += ' OFFSET ' + offset;
        }
        const params = _.values(criteria);

        return this.all(sql, params);
    }

    async insert(data) {
        const params = _.values(data);
        const sql = `
            INSERT INTO ${this.tableName} (${_.keys(data).join(',')})
            VALUES (${_.map(data, () => '?').join(',')})
        `;

        const result = await this.run(sql, params);

        if (result && result.id) {
            return await this.findOne({id: result.id});
        } else {
            return Promise.reject("Can not insert new item to table " + this.tableName);
        }
    }

    update(criteria, updateObject) {
        const updateFields = _.keys(updateObject).map(key => key + ' = ?').join(', ');
        const where = _.keys(criteria).map(k => `${k} = ?`).join(' AND ');
        const params = _.values(updateObject).concat(_.values(criteria));
        const sql = `
            UPDATE ${this.tableName}
            SET ${updateFields}
            WHERE ${where}
        `;
        console.log('update', sql);

        return this.run(sql, params);
    }

    delete(criteria) {
        const params = _.values(criteria);
        const where = _.keys(criteria).map(k => `${k} = ?`).join(' AND ');
        const sql = `DELETE FROM ${this.tableName} WHERE ${where}`;

        return this.run(sql, params);
    }
}
