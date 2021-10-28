const config = {
  user: 'dbadmin',
  password: 'Tay03146',
  server: 'databasejoactr.database.windows.net',
  database: 'joactrdb',
  pool: {
    max: 5,
    min: 2,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true, //Solo si es azure hace falta esto
  }
}

module.exports = config;
