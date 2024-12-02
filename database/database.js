const MySQL = require('mysql2');
const connection = MySQL.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    host: 'localhost',
    database: 'tajoiagames'
});

function selectJogos(){
  // Realizando uma consulta
  connection.query('SELECT * FROM jogos', (err, results) => {
    if (err) {
      console.error('Erro ao realizar a consulta:', err);
      return;
    }
    //console.log('Resultados da consulta:', results);
    //console.log(results);
    var jogosResultado = results;
    console.log(jogosResultado);
  });
  //return jogosResultado;
}

module.exports = {connection,selectJogos};
