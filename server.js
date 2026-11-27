require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const iniciarChat = require("./src/socket/chat.socket");

const app = require("./app");
const servidor = http.createServer(app);

const io = new Server(servidor, {
    cors: {
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
        methods: ["GET", "POST"]
    }
});

iniciarChat(io);

const prisma = require("./src/data/prisma");
const generos = [
    "Fantasia", "Romance", "Suspense e Mistério", "Terror",
    "Ficção Científica", "Aventura", "Drama", "Clássicos",
    "Romance Histórico", "Distopia", "Poesia", "Contos",
    "Crônicas", "Biografia", "Não Ficção", "Jovem Adulto",
    "Policial", "Humor", "Ficção Contemporânea"
];

const normalizar = texto => String(texto || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim();

async function garantirCanaisLiterarios() {
    const existentes = await prisma.salaChat.findMany({
        where: { tipo: "GENERO" },
        select: { nome: true, genero: true }
    });
    const nomes = new Set(existentes.map(sala => normalizar(sala.genero || sala.nome)));
    let criados = 0;
    for (const genero of generos) {
        const chave = normalizar(genero);
        if (nomes.has(chave)) continue;
        await prisma.salaChat.create({
            data: { nome: genero, tipo: "GENERO", genero }
        });
        nomes.add(chave);
        criados++;
    }
    console.log(`Canais literários: ${generos.length} disponíveis (${criados} novos).`);
}

let PORT = Number(process.env.PORT || 3000);

garantirCanaisLiterarios().then(() => {
    // Tenta iniciar o servidor; se a porta estiver ocupada, tenta a porta seguinte automaticamente
    servidor.listen(PORT, "0.0.0.0", () => {
        console.log("========================================");
        console.log("LONTRINOS BACKEND ATIVO");
        console.log(`URL: http://localhost:${PORT}`);
        console.log(`Arquivo iniciado: ${require("path").resolve(__filename)}`);
        console.log("Socket.IO ativo");
        console.log("Salas de chat: /salas e /api/salas");
        console.log(`Teste: http://localhost:${PORT}/__health`);
        console.log("========================================");
    });

    servidor.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
            console.warn(`A porta ${PORT} está ocupada. Tentando a porta ${PORT + 1} automaticamente...`);
            PORT += 1;
            servidor.listen(PORT, "0.0.0.0");
        } else {
            console.error("Erro no servidor:", err);
        }
    });

}).catch(erro => {
    console.error("Erro ao preparar os canais literários:", erro);
    process.exitCode = 1;
});