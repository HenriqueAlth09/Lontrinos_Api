require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));

app.get("/__health", (_req, res) => {
    res.status(200).json({
        ok: true,
        projeto: "Lontrinos",
        servidor: path.resolve(__dirname, "server.js"),
        mensagem: "Backend Lontrinos ativo"
    });
});

app.get("/api", (_req, res) => {
    res.status(200).json({
        ok: true,
        mensagem: "API Lontrinos funcionando",
        exemplos: [
            "GET /usuario/listar",
            "POST /usuario/cadastrar",
            "POST /usuario/login",
            "GET /livro/listar",
            "POST /livro/cadastrar",
            "GET /produto/listar",
            "POST /produto/cadastrar",
            "GET /resenha/listar",
            "POST /resenha/cadastrar",
            "GET /salas/listar",
            "POST /salas/cadastrar",
            "GET /mensagem/listar?salaId=1"
        ]
    });
});

const rotas = {
    usuarios: require("./src/routes/usuarios.routes"),
    livros: require("./src/routes/livros.routes"),
    produtos: require("./src/routes/produtos.routes"),
    resenhas: require("./src/routes/resenhas.routes"),
    mensagens: require("./src/routes/mensagens.routes"),
    pedidos: require("./src/routes/pedidos.routes"),
    planos: require("./src/routes/planos.routes"),
    assinaturas: require("./src/routes/assinaturas.routes"),
    enquetes: require("./src/routes/enquetes.routes"),
    salas: require("./src/routes/salas.routes"),
    leitores: require("./src/routes/leitores.routes"),
    admin: require("./src/routes/admin.routes")
};

app.use("/api/usuarios", rotas.usuarios);
app.use("/api/leitores", rotas.leitores);
app.use("/api/admin", rotas.admin);
app.use("/api/livros", rotas.livros);
app.use("/api/produtos", rotas.produtos);
app.use("/api/resenhas", rotas.resenhas);
app.use("/api/mensagens", rotas.mensagens);
app.use("/api/pedidos", rotas.pedidos);
app.use("/api/planos", rotas.planos);
app.use("/api/assinaturas", rotas.assinaturas);
app.use("/api/enquetes", rotas.enquetes);
app.use("/api/salas", rotas.salas);

app.use("/leitor", rotas.leitores);
app.use("/leitores", rotas.leitores);
app.use("/admin", rotas.admin);

app.use("/usuario", rotas.usuarios);
app.use("/usuarios", rotas.usuarios);

app.use("/livro", rotas.livros);
app.use("/livros", rotas.livros);

app.use("/produto", rotas.produtos);
app.use("/produtos", rotas.produtos);

app.use("/resenha", rotas.resenhas);
app.use("/resenhas", rotas.resenhas);

app.use("/mensagem", rotas.mensagens);
app.use("/mensagens", rotas.mensagens);

app.use("/pedido", rotas.pedidos);
app.use("/pedidos", rotas.pedidos);

app.use("/plano", rotas.planos);
app.use("/planos", rotas.planos);

app.use("/assinatura", rotas.assinaturas);
app.use("/assinaturas", rotas.assinaturas);

app.use("/enquete", rotas.enquetes);
app.use("/enquetes", rotas.enquetes);

app.use("/sala", rotas.salas);
app.use("/salas", rotas.salas);

app.use((req, res) => {
    res.status(404).json({
        erro: "Rota não encontrada neste backend",
        metodo: req.method,
        caminho: req.originalUrl,
        dica: "Confira se iniciou o backend da pasta Lontrinos/backend. Teste GET /__health."
    });
});

module.exports = app;