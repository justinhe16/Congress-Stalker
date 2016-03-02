var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('congress_stalker.db');
db.run("INSERT INTO users (userName, password) VALUES (?, ?)",
  'Stalker1', '1234',
  function(err) {
    if (err) { throw err;}
  }
);
