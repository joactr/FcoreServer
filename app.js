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
 jwt = require('jsonwebtoken'),
 bcrypt = require('bcrypt'),
 router = express.Router();

 PORT = process.env.PORT || 8080;
 app.use(bodyParser.urlencoded({ extended: true }));
 app.use(bodyParser.json());
 app.use(router);
 app.use(cors());
 app.use(cors({ credentials:true, origin:['http://localhost:3000','https://serraenvasfcore-es.herokuapp.com',
    'https://virosque-mockup.herokuapp.com']}));

 const pool = new sql.ConnectionPool(config);

app.use("/", (req, res, next) => {
  try {
    console.log("Recibida petición");
    if (req.path == "/login" || req.path == "/") {
      next();
    } else {
      /* decode jwt token if authorized*/
      jwt.verify(req.headers.token, 'Incre1bleclav3muy.segu,raXm!3.1', function (err, decoded) {
        if (decoded && decoded.user) {
          req.user = decoded;
          next();
        } else {
          return res.status(401).json({
            errorMessage: 'User unauthorized!',
            status: false
          });
        }
      })
    }
  } catch (e) {
    res.status(400).send();
  }
})

app.post("/login", (req, res) => {
  try{
    if(req.body.password && req.body.username) {
      funcSQL.login(req.body).reject("Timeout").then(result => {
        if (result.length == 1){
          var datos = result[0][0];
          console.log(datos)
          if(bcrypt.compareSync(datos.password, req.body.password)){
            checkUserAndGenerateToken(datos, req, res);
          }else{res.status(400).send();}
        }else{res.status(400).send();}
      })
    }else{res.status(400).send();}
  }catch(err){res.status(400).send();}
})

function checkUserAndGenerateToken(data, req, res) {
  jwt.sign({ user: data.username, nivel: data.nivel}, 'Incre1bleclav3muy.segu,raXm!3.1', {}, (err, token) => {
    if (err) {
      res.status(400).json({
        status: false,
        errorMessage: err,
      });
    } else {
      res.json({
        token: token,
        nivel: data.nivel,
        status: true
      }).send();
    }
  });
}

app.get('/getfechas', (req, res) => { //OBTIENE LAS ÚLTIMAS FECHAS DE PAROS PARA POPULAR EL FRONT-END
    funcSQL.getFechas("Piloto").then(result => {
       res.status(200);
       res.json(result[0]);
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

app.post("/setReporteMonitTR", (req, res) => { //Cambia el link del reporte power BI
  if (req.body.link && req.body.linea && req.body.proceso){
    var file_content = fs.readFileSync('powerbi.json');
    var content = JSON.parse(file_content);
    content[req.body.linea][req.body.proceso] = req.body.link; //Edita el valor del link necesario
    fs.writeFileSync("powerbi.json", JSON.stringify(content), function (err) {
        if (err) {
            console.log("An error occured while writing Object to File.");
            res.status(400).send('Error al escribir link PowerBI');
      }});
      res.status(200).send('Correcto');
  }else{res.status(400).send('Error al escribir link PowerBI');}
});


app.get("/getReporteMonitTR", (req, res) => { //Obtiene el link reporte power BI almacenado
    var link = fs.readFileSync("powerbi.json").toString();
    res.status(200).json(link);
});


app.get("/getReporteBI", (req, res) => { //Obtiene el link reporte power BI almacenado
    var link = fs.readFileSync("reporte.txt").toString();
    res.status(200).json(link);
});

app.post("/setPausas", (req, res) => { //Ajusta las pausas del PLC durante las cuales no se calculan KPI's
    let values = ''
    for(intervalo of req.body.intervalos){ //Iteramos lo recibido
      if(intervalo.inicio!=null){values += `(${req.body.linea},'${intervalo.inicio}','${intervalo.fin}'),`} //Agregamos los valores no nulos
    }
    values = values.replace(/,$/, ""); // Quita la última coma para la query
    funcSQL.borrarPausasLinea(req.body.linea).then(result => { //Se borran las pausas anteriores de la misma línea (quita interferencias)
      if (result){
        funcSQL.setPausas(values).then(result => { //Insertamos nuevas pausas
          if(result){res.status(200).send('Correcto');
          } else {res.status(400).send('Error');}
        });
      }else{res.status(400);res.send()}
       console.log("Pausas cambiadas");
    })
});


app.listen(PORT, console.log(`Servidor funcionando en puerto: ${PORT}`));
