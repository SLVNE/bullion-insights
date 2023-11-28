const { Pool } = require('pg');

const pool = new Pool({
  user: 'frontend',
  password: 'StupidFrontendPassword',
  host: 'localhost',
  port: 5432, // default Postgres port
  database: 'obsidianRoseData'
});

module.exports = {
  query: (text, params) => pool.query(text, params)
};

pool.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

/*pool.query('SELECT * FROM data WHERE vendor = \'moneymetals\' ORDER BY date ASC;', (err, res) => {
  if (err) throw err;
  console.log(res.rows);
  pool.end();
});*/
