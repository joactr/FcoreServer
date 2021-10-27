const fs = require('fs');
/*Función que edita el valor mínimo del trigger de la variable "atributo" con el valor "newval"*/
function savevarsmin (atributo, newval, m){
  var nuevoVal= parseFloat(newval);
  switch(atributo){
    case 'temperatura':
      m.temp_offset_min = nuevoVal;
      break;
    case 'vibraciones':
      m.vib_offset_min = nuevoVal;
      break;
    case 'piezas':
      m.piezas_offset_min = nuevoVal;
      break;
    case 'horas':
      m.horas_offset_min = nuevoVal;
      break;
    case 'compresor':
      m.compresor_offset_min = nuevoVal;
      break;
    default:
      console.error("No se ha introducido atributo en functest.js");
}}

/*Función que edita el valor máximo del trigger de la variable "atributo" con el valor "newval"*/
function savevarsmax (atributo, newval, m){
  var nuevoVal= parseFloat(newval);
  switch(atributo){
    case 'temperatura':
      m.temp_offset_max = nuevoVal;
      break;
    case 'vibraciones':
      m.vib_offset_max = nuevoVal;
      break;
    case 'piezas':
      m.piezas_offset_max = nuevoVal;
      break;
    case 'horas':
      m.horas_offset_max = nuevoVal;
      break;
    case 'compresor':
      m.compresor_offset_max = nuevoVal;
      break;
    default:
      console.error("No se ha introducido atributo");
}}

function generar (m){
  var text= `
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
  `
  fs.writeFileSync("generar.txt", text, function (err) {
});
}
module.exports = {savevarsmin, savevarsmax, generar}
