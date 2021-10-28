//APP LIMITES DE TRIGGER
const { Connection, Request } = require("tedious"),
 sql = require('mssql')
 fs = require('fs'),
 express = require("express"),
 app = express(),
 bodyParser = require("body-parser"),
 jwt = require('jsonwebtoken'),
 func = require('./functest.js')
 cors = require('cors'),
 router = express.Router();
 PORT = process.env.PORT || 8080;
 var cambiar,comentar = false; //¿Hay un resultado con la fecha introducida?
 app.use(bodyParser.urlencoded({ extended: true }));
 app.use(bodyParser.json());
 app.use(bodyParser.raw());
 app.use(router);
 app.use(cors());

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

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(router);

//HA RECIBIDO DATOS DEL FORMULARIO (min,max,atributo)
app.post("/limites", (req, res) => {
  const request = new sql.Request(pool);
  var recibido = req.body;
  console.log('He recibido datos:', recibido);
  if(recibido.min !==''){func.savevarsmin(recibido.atributo,recibido.min,m);}
  if(recibido.max !==''){func.savevarsmax(recibido.atributo,recibido.max,m);}

  try {
    request.query(`DROP TRIGGER IF EXISTS detectChange`, (err, result) => {
        if(err){
          console.error(err);
          res.status(400).send('Error');
        }else{
          console.log("Trigger borrado")
          modificar(recibido,res)
        }
    });

  }catch (e) {
    console.error(e);
    res.status(400).send('Error');
  }
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


var filename = 'database.json';
var m = JSON.parse(fs.readFileSync(filename).toString()); //Se abre el archivo con los valores anteriores

function modificar(recibido,res) {
  try{
    const request = new sql.Request(pool);
    request.query(`
    CREATE TRIGGER detectChange
    ON DB1
    INSTEAD OF INSERT AS
        SET NOCOUNT ON;
        DECLARE @columna INT;
        DECLARE @fila DateTime; --VARIABLE QUE INDICA LA FILA CAMBIADA (Date + Time)
        SELECT @fila = DateTime --LE ASIGNA VALOR A @FILA
        FROM inserted

        --VARIABLES DE OFFSET
        DECLARE @temp_offset_max NUMERIC(5);
        DECLARE @temp_offset_min NUMERIC(5);
        DECLARE @vib_offset_max NUMERIC(5);
        DECLARE @vib_offset_min NUMERIC(5);
        DECLARE @piezas_offset_max NUMERIC(5);
        DECLARE @piezas_offset_min NUMERIC(5);
        DECLARE @horas_offset_max NUMERIC(5);
        DECLARE @horas_offset_min NUMERIC(5);
        DECLARE @compresor_offset_max NUMERIC(5);
        DECLARE @compresor_offset_min NUMERIC(5);

        --EDITAR VALORES PARA CAMBIAR EL OFFSET
        SET @temp_offset_max = ${m.temp_offset_max};
        SET @temp_offset_min = ${m.temp_offset_min};
        SET @vib_offset_max = ${m.vib_offset_max};
        SET @vib_offset_min = ${m.vib_offset_min};
        SET @piezas_offset_max = ${m.piezas_offset_max};
        SET @piezas_offset_min = ${m.piezas_offset_min};
        SET @horas_offset_max = ${m.horas_offset_max};
        SET @horas_offset_min = ${m.horas_offset_min};
        SET @compresor_offset_max = ${m.compresor_offset_max};
        SET @compresor_offset_min = ${m.compresor_offset_min};

        SELECT TOP 1 * INTO #last --Se mete la última columna que ya existía
        FROM DB1
        WHERE DateTime = (SELECT MAX(DateTime)
            FROM DB1)

        IF EXISTS (SELECT * FROM #last AS t1 WHERE EXISTS (SELECT * FROM inserted AS t2 WHERE t1.Debobinadora <> t2.Debobinadora))  --DEBOBINADORA
            BEGIN
                INSERT INTO DB2 --SE INSERTA EN LA TABLA DE CAMBIOS
                    (Nombre_tabla, Columna_cambiada, Fila_cambiada)
                VALUES ('DB1','Debobinadora', @fila)
            END

        IF EXISTS (SELECT * FROM #last AS t1 WHERE EXISTS (SELECT * FROM inserted AS t2 WHERE t1.Horno <> t2.Horno))  --HORNO
            BEGIN
                INSERT INTO DB2 --SE INSERTA EN LA TABLA DE CAMBIOS
                    (Nombre_tabla, Columna_cambiada, Fila_cambiada)
                VALUES ('DB1','Horno', @fila)
            END

        IF EXISTS (SELECT * FROM #last AS t1 WHERE EXISTS (SELECT * FROM inserted AS t2 WHERE t1.Dobladora <> t2.Dobladora))  --DOBLADORA
            BEGIN
                INSERT INTO DB2 --SE INSERTA EN LA TABLA DE CAMBIOS
                    (Nombre_tabla, Columna_cambiada, Fila_cambiada)
                VALUES ('DB1','Dobladora', @fila)
            END

        IF EXISTS (SELECT * FROM #last AS t1 WHERE EXISTS (SELECT * FROM inserted AS t2 WHERE t1.Guiado <> t2.Guiado))  --GUIADO
            BEGIN
                INSERT INTO DB2 --SE INSERTA EN LA TABLA DE CAMBIOS
                    (Nombre_tabla, Columna_cambiada, Fila_cambiada)
                VALUES ('DB1','Guiado', @fila)
            END

        IF EXISTS (SELECT * FROM #last AS t1 WHERE EXISTS (SELECT * FROM inserted AS t2 WHERE t1.Troqueladora <> t2.Troqueladora))  --TROQUELADORA
            BEGIN
                INSERT INTO DB2 --SE INSERTA EN LA TABLA DE CAMBIOS
                    (Nombre_tabla, Columna_cambiada, Fila_cambiada)
                VALUES ('DB1','Troqueladora', @fila)
            END

        IF EXISTS (SELECT * FROM #last AS t1 WHERE EXISTS (SELECT * FROM inserted AS t2 WHERE t1.Extractor <> t2.Extractor))  --EXTRACTOR
            BEGIN
                INSERT INTO DB2 --SE INSERTA EN LA TABLA DE CAMBIOS
                    (Nombre_tabla, Columna_cambiada, Fila_cambiada)
                VALUES ('DB1','Extractor', @fila)
            END

        IF EXISTS (SELECT * FROM #last AS t1 WHERE EXISTS (SELECT * FROM inserted AS t2 WHERE t1.Temperatura + @temp_offset_max < t2.Temperatura
                            OR t1.Temperatura - @temp_offset_min > t2.Temperatura))     --TEMPERATURA
            BEGIN
                INSERT INTO DB2 --SE INSERTA EN LA TABLA DE CAMBIOS
                    (Nombre_tabla, Columna_cambiada, Fila_cambiada)
                VALUES ('DB1','Temperatura', @fila)
            END

        IF EXISTS (SELECT * FROM #last AS t1 WHERE EXISTS (SELECT * FROM inserted AS t2 WHERE t1.Vibraciones + @vib_offset_max < t2.Vibraciones
                            OR t1.Vibraciones - @vib_offset_min > t2.Vibraciones))     --VIBRACIONES
            BEGIN
                INSERT INTO DB2 --SE INSERTA EN LA TABLA DE CAMBIOS
                    (Nombre_tabla, Columna_cambiada, Fila_cambiada)
                VALUES ('DB1','Vibraciones', @fila)
            END

        IF EXISTS (SELECT * FROM #last AS t1 WHERE EXISTS (SELECT * FROM inserted AS t2 WHERE t1.Numero_de_piezas + @piezas_offset_max < t2.Numero_de_piezas
                            OR t1.Numero_de_piezas - @piezas_offset_min > t2.Numero_de_piezas))     --NUMERO DE PIEZAS
            BEGIN
                INSERT INTO DB2 --SE INSERTA EN LA TABLA DE CAMBIOS
                    (Nombre_tabla, Columna_cambiada, Fila_cambiada)
                VALUES ('DB1','Numero_de_piezas', @fila)
            END

        IF EXISTS (SELECT * FROM #last AS t1 WHERE EXISTS (SELECT * FROM inserted AS t2 WHERE t1.Numero_de_horas + @horas_offset_max < t2.Numero_de_horas
                            OR t1.Numero_de_horas - @horas_offset_min > t2.Numero_de_horas))     --NUMERO DE HORAS
            BEGIN
                INSERT INTO DB2 --SE INSERTA EN LA TABLA DE CAMBIOS
                    (Nombre_tabla, Columna_cambiada, Fila_cambiada)
                VALUES ('DB1','Numero_de_horas', @fila)
            END

        IF EXISTS (SELECT * FROM #last AS t1 WHERE EXISTS (SELECT * FROM inserted AS t2 WHERE t1.Temperatura_elemento_compresor + @compresor_offset_max < t2.Temperatura_elemento_compresor
                            OR t1.Temperatura_elemento_compresor - @compresor_offset_min > t2.Temperatura_elemento_compresor))     --TEMPERATURA ELEMENTO COMPRESOR
            BEGIN
                INSERT INTO DB2 --SE INSERTA EN LA TABLA DE CAMBIOS
                    (Nombre_tabla, Columna_cambiada, Fila_cambiada)
                VALUES ('DB1','Temperatura_elemento_compresor', @fila)
            END

        DELETE FROM #last
        INSERT INTO DB1 SELECT * FROM inserted
    `, (err, result) => {
        if(err){
          console.error(err);
          res.status(400).send('Error');
        }else{
          console.log("Trigger añadido");
          res.status(200).send('OK');
        }
    });
  }catch(err){
    console.error(err);
    res.status(400).send('Error');
  }
  func.generar(m);
  guardar();
}


function guardar(){
  var guardado = JSON.stringify(m);
  fs.writeFileSync("database.json", guardado, function (err) {
      if (err) {
          console.log("An error occured while writing JSON Object to File.");
          return console.log(err);
    }
    console.log('Éxito al guardar output.json');
  });
}
