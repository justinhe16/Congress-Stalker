DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS legislators;
DROP TABLE IF EXISTS bills;
DROP TABLE IF EXISTS user_leg;
DROP TABLE IF EXISTS user_bill;

CREATE TABLE users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	userName TEXT,
	password TEXT
);

CREATE TABLE legislators (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	first_name TEXT,
	last_name, TEXT,
	twitter TEXT,
	party TEXT
);

CREATE TABLE bills (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT,
	date TEXT,
	sponsor_first_name TEXT,
	sponsor_last_name TEXT
);

CREATE TABLE user_leg (
	user_id INTEGER,
	leg_id INTEGER,

	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (leg_id) REFERENCES legislators(id) ON DELETE CASCADE
);

CREATE TABLE user_bill (
	user_id INTEGER,
	bill_id INTEGER,

	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
	FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
);


