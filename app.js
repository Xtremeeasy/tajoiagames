const express = require("express");
const session = require('express-session'); //Para conseguir utilizar sessões de usuários
const multer = require('multer');
const path = require('path');
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
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, path.join(__dirname, 'public/images')); // Pasta onde as imagens serão salvas
  },
  filename: (req, file, cb) => {
    numeroDeJogos((error, count) => {
        if (error) {
            return cb(error); // Passa o erro para o callback
        }
        cb(null, "game_card-" + count + path.extname(file.originalname)); // Nome do arquivo
    });
  } 
});
const upload = multer({ storage: storage });

function numeroDeJogos(callback) {
  const query = 'SELECT COUNT(*) AS count FROM Jogos';
  
  connection.query(query, (error, results) => {
      if (error) {
          return callback(error, null);
      }
      // Retorna a contagem
      callback(null, results[0].count);
  });
}
numeroDeJogos((error, count) => {
  if (error) {
      console.error('Erro ao contar os jogos:', error);
  } else {
      console.log('Número de jogos:', count);
  }
})

//rotas
app.get("/", function (req, res) {
  connection.query('SELECT * FROM Jogos', (err, results) => {
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
    if(req.session.adm == 1){
      res.render("painel-adm.ejs");
    } else {
      res.render("painel-cliente.ejs");
    }
  } else {
    res.render("login.ejs");
  }

});

app.get("/single-product/:nomeJogo", (req, res) => {
  var nomeJogo = req.params.nomeJogo
  connection.query("SELECT j.*, r.comentario, r.rating, r.data_review, u.nomeUsuario FROM Jogos j LEFT JOIN Reviews r ON j.id_jogo = r.id_jogo LEFT JOIN Usuarios u ON r.id_usuario = u.id_usuario WHERE j.nome = ?", [nomeJogo], (err, results) => {
    if (err) {
      console.error('Erro ao realizar a consulta:', err);
    }
    
    let jogo = results[0];
    res.render("index.ejs", { conteudo:'single-product', jogo: jogo, req: req});
  });
});

app.post("/logar", (req, res) => {
  let email = req.body.email;
  let senha = req.body.senha;

  console.log(email);
  console.log(senha);
  
  connection.query(`SELECT id_usuario, administrador FROM Usuarios WHERE email = ? AND senha = ?`, [email, senha], (err, results) => {
    if (err) {
      console.log("Erro ao realizar login", err);
      return res.status(500).send("Erro ao realizar login");
    }

    if (results.length > 0) {
      req.session.userId = results[0].id_usuario; //Atribuindo o id do usuário à variável de sessão
      req.session.adm = results[0].administrador
      if(req.session.adm == 1){
        res.render("painel-adm.ejs");
      } else {
        res.render("painel-cliente.ejs")
      }
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

    // Retorna os dados dos pedidos em formato JSON
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
  let email = req.body.email;
  let senha = req.body.senha;

  connection.query(`SELECT id_usuario FROM Usuarios WHERE email = ? AND senha = ? AND administrador = 1`, [email, senha], (err, results) => {
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

//cadastrar jogo
app.post("/painel-adm/cadastrar-jogo",upload.single('imagemJogo'), (req, res) => {
  let nomeJogo = req.body.nomeJogo;
  let desenvolvedora = req.body.desenvolvedora;
  let editora = req.body.editora;
  let dataLancamento = req.body.dataLancamento;
  let preco = req.body.preco;
  let categorias = req.body.categorias;
  let plataformas = req.body.plataformas;
  let modoDeJogo = req.body.modoDeJogo;
  let idiomas = req.body.idiomas;
  let descricao = req.body.descricao;
  let sobre = req.body.sobre;
  let requisitos = req.body.requisitos;
  if (req.file) {
    console.log("Imagem cadastrada com sucesso!")
  } else {
      console.log('Erro ao enviar o arquivo.');
      console.log("req.file: " + req.file);
  }
  
  numeroDeJogos((error, count) => {
    if (error) {
        console.error('Erro ao contar os jogos:', error);
        return; // Retorna em caso de erro
    }

    // Prepara o nome da imagem usando a contagem de jogos
    const imagem = "images/game_card-" + count + path.extname(req.file.originalname); // ou o formato correto da imagem

    // Executa a consulta de inserção
    connection.query(`INSERT INTO Jogos (nome, descricao, desenvolvedor, editora, data_lancamento, preco, Categorias, Plataforma, Modo_de_jogo, Idioma, Sobre, Requisitos_de_Sistema, imagem) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [nomeJogo, descricao, desenvolvedora, editora, dataLancamento, preco, categorias, plataformas, modoDeJogo, idiomas, sobre, requisitos, imagem], 
    (err, results) => {
        if (err) {
            console.log("Erro ao cadastrar jogo", err);
            return res.status(500).json({ error: "Erro ao cadastrar jogo" });
        } else {
          res.render("painel-adm.ejs");
          console.log("Jogo cadastrado com sucesso!");
        }
    });
  });
});

//Carrinho
app.post("/adicionar-no-carrinho", (req, res) => {
  let idJogo = req.body.idJogo;
  console.log(idJogo);
  connection.query(`INSERT INTO itens_carrinho(id_item, id_carrinho) VALUES(?, ?)`, [idJogo, req.session.userId], (err, results) => {
    if(err){
      console.log(err);
      console.log("Falha ao adicionar o jogo no carrinho.");
    } else {
      console.log("Jogo adicionado com sucesso no carrinho: " + req.session.userId);
    }
  })
});

//Avaliações
app.post("/single-product/avaliar", (req,res) => {
  let comentario = req.body.comentario;
  let id_usuario = req.session.userId;
  let id_jogo = req.body.id_jogo;
  let nome = req.body.nome;
  let nomeUsuario = req.body.nomeUsuario;
  connection.query(`INSERT INTO Reviews(id_jogo, id_usuario, rating, comentario) VALUES(?, ?, 4, ?)`, [id_jogo, id_usuario, comentario], (err, results) => {
    if(err) {
      console.log("Falha ao adicionar a review");
    }
  });
  res.redirect(`/single-product/${nome}`)
});


app.listen(porta, () => {
  console.log(`Servidor funcionando na porta: ${porta}`);
});