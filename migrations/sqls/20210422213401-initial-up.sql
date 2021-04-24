/* Replace with your SQL commands */
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    web3adr text,
    btcadr text,
    label text UNIQUE ,
    dateAdded datetime
);

CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userAdrLabel text,
    txHash text UNIQUE,
    txId INTEGER UNIQUE,
    valueBtc INTEGER,
    dateAdded datetime,
    status text,
    type text
);
