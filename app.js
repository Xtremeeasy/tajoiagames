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

//pegando jogos
var jogos = selectJogos();

// Fechando a conexão
connection.end();

//arquivos estáticos
app.use(express.static("public"));

//rotas
app.get("/", function (req, res) {
  res.render("index.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/single-product", (req, res) => {
  res.render("single-product.ejs");
});

app.listen(porta, () => {
  console.log(`Servidor funcionando na porta: ${porta}`);
});
