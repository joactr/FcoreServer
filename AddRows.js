const { Connection, Request } = require("tedious"),
 sql = require('mssql')
 fs = require('fs'),
 express = require("express"),
 app = express(),
 moment = require("moment"),
 bodyParser = require("body-parser"),
 router = express.Router();
 PORT = process.env.PORT || 8080;
 var cambiar,comentar = false; //¿Hay un resultado con la fecha introducida?
 app.use(bodyParser.urlencoded({ extended: true }));
 app.use(bodyParser.json());
 app.use(bodyParser.raw());
 app.use(router);
var cont = 282720;
var variable = 0;

const pool = new sql.ConnectionPool({
    user: 'sa',
    password: 'Tay03146',
    server: 'localhost',
    database: 'joactrdb',
    pool: {
      max: 5,
      min: 2,
      idleTimeoutMillis: 30000
    },
    options: {
      trustServerCertificate: true
    }
});
pool.connect(err => {
    if(err){
      console.error(err)
    }
    console.log("Conexión con éxito a la base de datos")
})


app.listen(PORT, console.log(`Servidor funcionando en puerto: ${PORT}`));

setInterval(()=>{
  const request = new sql.Request(pool);
  var x = new Date();
  console.log(`INSERT INTO Gaviota VALUES
    (${cont},${variable},'${moment.parseZone(x).utcOffset(0, true).format()}',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,6782.0000000000000000,21469.0000000000000000,80.8021240234375000,31.5897350311279300,0.0000000000000000,0.0000000000000000,274.0000000000000000,98.5401458740234400)`)
  request.query(`INSERT INTO Gaviota VALUES
    (${cont},${variable},'${moment.parseZone(x).utcOffset(0, true).format()}',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,6782.0000000000000000,21469.0000000000000000,80.8021240234375000,31.5897350311279300,0.0000000000000000,0.0000000000000000,274.0000000000000000,98.5401458740234400)`, (err, result) => {
      if(err){
        console.error(err);
      }else{console.log(result.rowsAffected)}
  });
  cont = cont + 1;
  variable = variable + 1;
},10000)
