const config = {
  user: 'dbadmin',
  password: 'Tay03146',
  server: 'sqlenira1.database.windows.net',
  database: 'powerAutomate',
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
