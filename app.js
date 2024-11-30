const express = require("express");
const session = require('express-session'); //Para conseguir utilizar sessões de usuários
const app = express();
const { connection, selectJogos } = require("./database/database");
const porta = 9999;

app.use(session({
  secret: '9b9112b921a5a738f118868099d178053358d588403f3015d45d7369bb469307', //Chave secreta
  resave: false,
  saveUninitialized: true,
}));

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
    res.render("index.ejs", { conteudo:'inicial', jogos: jogos });
  });
});

app.get("/login", (req, res) => {
  if(req.session.userId){
    res.render("painel-cliente.ejs");
  } else {
    res.render("login.ejs");
  }

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
  
  connection.query(`SELECT id_usuario FROM usuarios WHERE email = ? AND senha = ?`, [email, senha], (err, results) => {
    if (err) {
      console.log("Erro ao realizar login", err);
      return res.status(500).send("Erro ao realizar login");
    }

    if (results.length > 0) {
      req.session.userId = results[0].id_usuario; //Atribuindo o id do usuário à variável de sessão
      res.render("painel-cliente.ejs")
      console.log("Login bem-sucedido");
    } else {
      console.log("Login ou senha incorretos");
      return res.status(401).send("Login ou senha incorretos");
    }


  });
});



app.post("/logar/mostrar-pedidos", (req, res) => {
  const id_usuario = req.session.userId;
  connection.query(`CALL procedure_pedidos_cliente(${id_usuario})`, (err, results) => {
    if (err) {
      console.log("Erro ao buscar pedidos", err);
      return res.status(500).json({ error: "Erro ao buscar pedidos" });
    }

    // Retorna os dados dos usuários em formato JSON
    res.json({ pedidos: results[0] });
  });
});
// admin
app.get("/admin", (req, res) => {
  if (req.session.userId){
    res.render("painel-adm.ejs");
  } else {
    res.render("admin.ejs");
  }
});

app.post("/admin/login", (req, res) => {
  let email = req.body.email; // Use req.body para acessar os dados do corpo da requisição
  let senha = req.body.senha;

  connection.query(`SELECT id_usuario FROM usuarios WHERE email = ? AND senha = ? AND administrador = 1`, [email, senha], (err, results) => {
    if(err){
      console.log("Erro ao realizar o login", err);
      return res.status(500).send("Erro ao realizar login");
    }

    if (results.length > 0) {
      req.session.userId = results[0].id_usuario;
      console.log(req.session.userId)
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

app.post("/painel-adm/mostrar-usuarios", (req, res) => {
  connection.query(`CALL procedure_usuarios_registrados`, (err, results) => {
    if (err) {
      console.log("Erro ao buscar usuários", err);
      return res.status(500).json({ error: "Erro ao buscar usuários" });
    }

    // Retorna os dados dos usuários em formato JSON
    res.json({ usuarios: results[0] });
  });
});

app.post("/painel-adm/mostrar-pedidos", (req, res) => {
  connection.query(`CALL procedure_pedidos_geral`, (err, results) => {
    if (err) {
      console.log("Erro ao buscar pedidos", err);
      return res.status(500).json({ error: "Erro ao buscar pedidos" });
    }

    // Retorna os dados dos usuários em formato JSON
    res.json({ pedidos: results[0] });
  });
});


//Avaliações
app.post("/single-product/avaliar", (req,res) => {
  let nome = req.body.nome;
  let email = req.body.email;
  let comentario = req.body.comentario;
  let id_usuario = req.session.userId;
  connection.query(`INSERT INTO reviews(?, ?, 3, ?, ?) VALUES(1, ${req.session.userId}, 3, 'Testando', 'Ótimo')`, [1, id_usuario, comentario], (err, results) => {
    if(err) {
      console.log("Falha ao adicionar a review");
    }
  });
});


app.listen(porta, () => {
  console.log(`Servidor funcionando na porta: ${porta}`);
});
