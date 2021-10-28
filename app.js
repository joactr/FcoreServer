//APP LIMITES DE TRIGGER
const sql = require('mssql')
 fs = require('fs'),
 config = require("./dbconfig.js"),
 express = require("express"),
 app = express(),
 bodyParser = require("body-parser"),
 jwt = require('jsonwebtoken'),
 funcSQL = require('./funcSQL.js'),
 cors = require('cors'),
 router = express.Router();
 PORT = process.env.PORT || 8080;
 var cambiar,comentar = false; //¿Hay un resultado con la fecha introducida?
 app.use(bodyParser.urlencoded({ extended: true }));
 app.use(bodyParser.json());
 app.use(bodyParser.raw());
 app.use(router);
 app.use(cors());

 const pool = new sql.ConnectionPool(config);

app.get('/incidencias', (req, res) => {
    funcSQL.getFechas().then(result => {
       res.status(200);
       res.json(result[0]);
       console.log("Petición incidencias atendida");
    })
});

app.post("/limites", (req, res) => {
  console.log('He recibido datos:', req.body)
  funcSQL.setLimites(req.body).then(result => {
    if (result == true){
      funcSQL.setTrigger(req.body).then(result => {
        if (result == true){
          res.status(200).send('Correcto');
        }else{res.status(400).send("Error");}
      })
    }else{res.status(400).send("Error")}
  })
});

app.get("/", (req, res) => {
  res.send("Estás conectado con el back-end");
});

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

app.listen(PORT, console.log(`Servidor funcionando en puerto: ${PORT}`));
