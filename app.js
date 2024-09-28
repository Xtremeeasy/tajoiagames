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
    res.render("index.ejs", {jogos:jogos});
  });
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
