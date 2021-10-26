const { Connection, Request } = require("tedious"),
 sql = require('mssql')
 fs = require('fs'),
 express = require("express"),
 app = express(),
 bodyParser = require("body-parser"),
 jwt = require('jsonwebtoken'),
 router = express.Router();
 PORT = process.env.PORT || 8080;
 var cambiar,comentar = false; //¿Hay un resultado con la fecha introducida?
 app.use(bodyParser.urlencoded({ extended: true }));
 app.use(bodyParser.json());
 app.use(bodyParser.raw());
 app.use(router);


const pool = new sql.ConnectionPool({
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
});

pool.connect(err => {
    if(err){
      console.error(err)
    }
    console.log("Conexión con éxito a la base de datos")
})

app.listen(PORT, console.log(`Servidor funcionando en puerto: ${PORT}`));


//HA RECIBIDO DATOS DEL FORMULARIO (fecha,atributo,valor,comentario)
app.post("/formulario", (req, res) => {
  const request = new sql.Request(pool);
  var recibido = req.body;
  console.log('He recibido datos:', recibido);
  request.query(`SELECT * FROM DB1 WHERE DateTime = '${recibido.fecha}'`, (err, result) => {
      if(err){
        console.error(err);
      }
      if (result.rowsAffected >= 1){
        console.log("Encontrado valor con esa fecha")
        modificar(recibido,res)
      }else {
        console.log("No encontrado valor con esa fecha")
        res.status(400).send('No se ha encontrado la fecha');
      }
  });
});

app.post("/getToken",(req, res) => {
  console.log("Me han pedido un token");
  console.log(req.body);
  //9a23e74b-ea09-47cf-a6eb-46dfacd632f5 TENANT ENIRA
  //https://login.microsoftonline.com/joactrjm/oauth2/v2.0/token

});

app.get("/", function(req, res) {
  res.send('hello world');
});

function modificar(recibido,res) {
  if(recibido.atributo !== '' && recibido.valor !== ''){ //ES UNA OPERACIÓN DE MODIFICAR DATOS?
    cambiar = true;
  }else{cambiar = false;}
  if(recibido.comentario !== ''){ //ES UNA OPERACIÓN DE COMENTAR LA INCIDENCIA?
    comentar = true;
  }else{comentar = false;}

  try{
    var query = '';
    var cambiar_query = `UPDATE DB1 SET ${recibido.atributo} = '${recibido.valor}' WHERE DateTime = '${recibido.fecha}';`;
    var comentar_query = `UPDATE DB1 SET Comentario = '${recibido.comentario}' WHERE DateTime = '${recibido.fecha}';`;
    var ambas_query = `UPDATE DB1 SET Comentario = '${recibido.comentario}', ${recibido.atributo} = '${recibido.valor}' WHERE DateTime = '${recibido.fecha}';`;
    if(cambiar == true && comentar == true){ //DEPENDIENDO DE LA OPERACIÓN A REALIZAR HACE UNA QUERY U OTRA
      query = ambas_query;

    }else if (cambiar == true && comentar == false) {
      query = cambiar_query;
    }else{query = comentar_query;}
    const request = new sql.Request(pool);
    console.log(query);
    request.query(query, (err, result) => {
        if(err){
          console.error(err);
        }
        //SE HA PODIDO MODIFICAR EL VALOR
        if (result.rowsAffected >= 1){
          console.log("Valor modificado con éxito")
          res.status(200).send('OK');
        }else{
          res.status(400).send('Bad Request');
        }

    });
  }catch(err){
    res.status(400).send('Bad Request');
    console.error(err)
  }

}
