CREATE TABLE transactions_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    txId INTEGER,
    userAdrLabel TEXT,
    txHash TEXT,
    vout INTEGER NOT NULL DEFAULT -1,
    valueBtc INTEGER,
    dateAdded DATETIME,
    status TEXT,
    type TEXT
);

INSERT INTO transactions_new
         (id, txId, userAdrLabel, txHash, vout, valueBtc, dateAdded, status, type)
   SELECT id, txId, userAdrLabel, txHash, vout, valueBtc, dateAdded, status, type
   FROM transactions;

-- create unique partial indexes
-- https://sqlite.org/partialindex.html#unique_partial_indexes
-- before vout distinction, userAdrLabel, txHash was unique.
-- after vout distinction, txHash, txId is unique.

CREATE UNIQUE INDEX txhash_label_before_vout_distinction ON transactions_new(txHash, userAdrLabel) WHERE vout = -1;
CREATE UNIQUE INDEX txhash_label_after_vout_distinction ON transactions_new(txHash, vout) WHERE vout != -1;

DROP TABLE transactions;
ALTER TABLE transactions_new RENAME TO transactions;

