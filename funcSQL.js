const { Connection, Request } = require("tedious"),
 config = require("./dbconfig.js"),
 sql = require('mssql'),
 func = require('./funcAux.js'),
 fs = require('fs');
 var cambiar,comentar = false; //¿Hay un resultado con la fecha introducida?
 module.exports = { //HACE QUE LAS FUNCIONES SEAN VISIBLES FUERA DEL ARCHIVO
     getFechas: getFechas,
     setLimites: setLimites,
     setTrigger: setTrigger,
     searchFechas: searchFechas,
     setIncidencia: setIncidencia
 }
const pool = new sql.ConnectionPool(config);

//Función que devuelve las primeras 10 fechas de la BD para popular dropdowns
async function getFechas() {
    try {
        let pool = await sql.connect(config);
        let fechas = await pool.request().query(`SELECT TOP 15 Datetime, Vibraciones FROM DB1 ORDER BY DateTime DESC`);
        return fechas.recordsets;
    }
    catch (error) {
        console.log(error);
    }
}

async function setLimites(recibido) {
    try {
        let pool = await sql.connect(config);
        let request = await pool.request().query(`DROP TRIGGER IF EXISTS detectChange`);
        console.log("Trigger borrado");
        return true;
    }catch (error) {
        console.log(error);
        return false;
    }
}

async function searchFechas(recibido) {
  try {
      let pool = await sql.connect(config);
      let fechas = await pool.request().query(`SELECT * FROM DB1 WHERE DateTime = '${recibido.fecha}'`);
      return fechas.recordsets;
  }
  catch (error) {
      console.log(error);
  }
}

async function setIncidencia(recibido) {
  try {
    var query = '';
    var cambiar_query = `UPDATE DB1 SET ${recibido.atributo} = '${recibido.valor}' WHERE DateTime = '${recibido.fecha}';`;
    var comentar_query = `UPDATE DB1 SET Comentario = '${recibido.comentario}' WHERE DateTime = '${recibido.fecha}';`;
    var ambas_query = `UPDATE DB1 SET Comentario = '${recibido.comentario}', ${recibido.atributo} = '${recibido.valor}' WHERE DateTime = '${recibido.fecha}';`;

    if(recibido.atributo !== '' && recibido.valor !== ''){ //ES UNA OPERACIÓN DE MODIFICAR DATOS?
      cambiar = true;
    }else{cambiar = false;}
    if(recibido.comentario !== ''){ //ES UNA OPERACIÓN DE COMENTAR LA INCIDENCIA?
      comentar = true;
    }else{comentar = false;}

    if(cambiar == true && comentar == true){ //DEPENDIENDO DE LA OPERACIÓN A REALIZAR HACE UNA QUERY U OTRA
      query = ambas_query;
      console.log("ambas")
    }else if (cambiar == true && comentar == false) {
      query = cambiar_query;
      console.log("modificar datos")
    }else{query = comentar_query;
    console.log("comentar")}
    let pool = await sql.connect(config);
    let request = await pool.request().query(query);
    return request.rowsAffected;
  }
  catch (error) {
    console.log(error);
  }
}

async function setTrigger(recibido){
  try{
    var filename = 'database.json';
    var m = JSON.parse(fs.readFileSync(filename).toString()); //Se abre el archivo con los valores anteriores
    if(recibido.min !==''){func.savevarsmin(recibido.atributo,recibido.min,m);}
    if(recibido.max !==''){func.savevarsmax(recibido.atributo,recibido.max,m);}
    let pool = await sql.connect(config);
    let request = await pool.request().query(`
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
    `);
    func.generar(m);
    guardar(m);
    console.log("Trigger añadido");
    return true;
  }catch(err){
    console.error(err);
    return false;
  }
}

function guardar(m){
  var guardado = JSON.stringify(m);
  fs.writeFileSync("database.json", guardado, function (err) {
      if (err) {
          console.log("An error occured while writing JSON Object to File.");
          return console.log(err);
    }
    console.log('Éxito al guardar output.json');
  });
}
