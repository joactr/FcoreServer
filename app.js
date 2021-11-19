//APP LIMITES DE TRIGGER
const sql = require('mssql')
 fs = require('fs'),
 config = require("./dbconfig.js"),
 express = require("express"),
 app = express(),
 bodyParser = require("body-parser"),
 jwt = require('jsonwebtoken'),
 funcSQL = require('./funcSQL.js'),
 funcAux = require('./funcAux.js'),
 cors = require('cors'),
 router = express.Router();
 PORT = process.env.PORT || 8080;
 app.use(bodyParser.urlencoded({ extended: true }));
 app.use(bodyParser.json());
 app.use(bodyParser.raw());
 app.use(router);
 app.use(cors());

 const pool = new sql.ConnectionPool(config);

app.get('/getfechas', (req, res) => { //OBTIENE LAS ÚLTIMAS FECHAS PARA POPULAR EL FRON-END
    funcSQL.getFechas().then(result => {
       res.status(200);
       res.json(result[0]);
       console.log("Petición incidencias atendida");
    })
});

//Recibe "atributo" y max/min (o ambos)
app.post("/limites", (req, res) => { //MODIFICA LOS LIMITES DEL TRIGGER SQL
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
  res.send("Estás conectado con el back-end de factorybi");
});

//Recibe fecha, y un comentario / atributo + valor
app.post("/incidencia", (req, res) => { //INSERTA UNA NUEVA INCIDENCIA MODIFICANDO LA TABLA
  console.log('He recibido incidencia:', req.body);
  funcSQL.searchFechas(req.body).then(result => {
    if (result[0].length > 0){ //Los valores estan contenidos en la posicion 0
      console.log("Encontrado valor con esa fecha: ", result[0].length)
      funcSQL.setIncidencia(req.body).then(result => {
        if(result>0){
          res.status(200).send('Correcto');
        } else {res.status(400).send('Error');}
      });
    }
    else{res.status(400).send('No se ha encontrado la fecha');}
     console.log("Petición incidencias atendida");
  })
});


app.post("/setReporteBI", (req, res) => { //Cambia el link del reporte power BI

  if (req.body.link){
    fs.writeFileSync("reporte.txt", req.body.link, function (err) {
        if (err) {
            console.log("An error occured while writing Object to File.");
            res.status(400).send('Error al escribir link PowerBI');
      }});
      res.status(200).send('Correcto');
      console.log("Cambiado link PowerBI");
  }else{res.status(400).send('Error al escribir link PowerBI');}
});


app.get("/getReporteBI", (req, res) => { //Obtiene el link reporte power BI almacenado
  console.log("Obtiene el link reporte power BI")
    var link = fs.readFileSync("reporte.txt").toString();
    console.log(link);
    res.status(200).json(link);

});


app.listen(PORT, console.log(`Servidor funcionando en puerto: ${PORT}`));
