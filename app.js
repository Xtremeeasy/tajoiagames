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
app.use(express.urlencoded({ extended: true }));

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

app.post("/logar", (req, res) => {
  let email = req.body.email; // Use req.body para acessar os dados do corpo da requisição
  let senha = req.body.senha;

  console.log(email);
  console.log(senha);
  
  connection.query(`SELECT email FROM usuarios WHERE email = ? AND senha = ?`, [email, senha], (err, results) => {
    if (err) {
      console.log("Erro ao realizar login", err);
      return res.status(500).send("Erro ao realizar login");
    }

    if (results.length > 0) {
      console.log("Login bem-sucedido");
      return res.status(200).send("Login bem-sucedido");
    } else {
      console.log("Login ou senha incorretos");
      return res.status(401).send("Login ou senha incorretos");
    }
  });
});

// admin
app.get("/admin", (req, res) => {
  res.render("admin.ejs");
});

app.post("/admin/login", (req, res) => {
  let email = req.body.email; // Use req.body para acessar os dados do corpo da requisição
  let senha = req.body.senha;

  connection.query(`SELECT email FROM usuarios WHERE email = ? AND senha = ? AND administrador = 1`, [email, senha], (err, results) => {
    if(err){
      console.log("Erro ao realizar o login", err);
      return res.status(500).send("Erro ao realizar login");
    }

    if (results.length > 0) {
      console.log("Login bem-sucedido");
      res.render("painel-adm.ejs");
    } else {
      console.log("Login ou senha incorretos");
      return res.status(401).send("Login ou senha incorretos");
    }
  })
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

app.get("/painel-adm/mostrar-usuarios", (req, res) => {
  connection.query(`CALL procedure_usuarios_registrados()`, (err, results) =>{
    if(err){
      console.error('Erro ao realizar a consulta', err);
    }
  });

});


app.listen(porta, () => {
  console.log(`Servidor funcionando na porta: ${porta}`);
});
