/* just create it once */
CREATE TABLE IF NOT EXISTS user_save_lowercase_migration AS SELECT * from user WHERE false;
INSERT INTO user_save_lowercase_migration SELECT * FROM user;
UPDATE user SET web3adr = lower(web3adr);
