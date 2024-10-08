const express = require("express");
const app = express();
const { connection, selectJogos } = require("./database/database");
const porta = 9999;

//BANCO DE DADOS
//conectando ao banco de dados
connection.connect((err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err);
    return;
  }
  console.log("Conectado ao banco de dados MySQL!");
});

//arquivos estáticos
app.use(express.static("public"));

//rotas
app.get("/", function (req, res) {
  connection.query('SELECT * FROM jogos', (err, results) => {
    if (err) {
      console.error('Erro ao realizar a consulta:', err);
      return;
    }
    var jogos = results;
    console.log(jogos)
    res.render("index.ejs", { conteudo:'inicial', jogos: jogos });
  });
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/single-product/:nomeJogo", (req, res) => {
  var nomeJogo = req.params.nomeJogo
  connection.query('SELECT * FROM jogos', (err, results) => {
    if (err) {
      console.error('Erro ao realizar a consulta:', err);
      return;
    }
    var jogos = results;
    //console.log(jogos)
    var idJogo;
    jogos.forEach(jogo => {
      if(jogo.nome == nomeJogo){
        idJogo = jogo.id_jogo;
      }
    });
    res.render("index.ejs", { conteudo:'single-product', jogo: jogos[idJogo-1] });
  });
});

app.listen(porta, () => {
  console.log(`Servidor funcionando na porta: ${porta}`);
});
