CREATE TABLE deposit_address_signature (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deposit_address_id INTEGER REFERENCES user(id) NOT NULL,
    signer TEXT NOT NULL,
    signature TEXT NOT NULL,
    created DATETIME NOT NULL,
    UNIQUE (deposit_address_id, signer)
);
