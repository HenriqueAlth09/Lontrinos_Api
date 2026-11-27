
const jwt = require("jsonwebtoken");
const prisma = require("../data/prisma");
const { verificarAcessoSala } = require("../middlewares/acessoChat");

const iniciarChat = (io) => {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;

            if (typeof token !== "string" || !token) {
                return next(new Error("Token não informado"));
            }

            const payload = jwt.verify(
                token,
                process.env.SECRET_JWT
            );

            const usuarioId = Number(payload.id);

            if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
                return next(new Error("Usuário inválido"));
            }

            const usuario = await prisma.usuario.findUnique({
                where: { id: usuarioId },
                select: { id: true, apelido: true }
            });

            if (!usuario) {
                return next(new Error("Usuário não encontrado"));
            }

            if (!usuario.apelido) return next(new Error("Defina seu nome de usuário no perfil antes de usar o chat"));
            socket.data.usuarioId = usuarioId;
            next();
        } catch (e) {
            next(new Error("Autenticação inválida"));
        }
    });

    io.on("connection", (socket) => {
        const usuarioId = socket.data.usuarioId;

        socket.on("entrarSala", async (dados, callback) => {
            try {
                const salaId = Number(dados?.salaId);

                const acesso = await verificarAcessoSala(
                    usuarioId,
                    salaId
                );

                if (!acesso.permitido) {
                    return responder(callback, {
                        sucesso: false,
                        erro: acesso.erro
                    });
                }

                await socket.join(`sala_${salaId}`);

                responder(callback, {
                    sucesso: true,
                    salaId,
                    mensagem: "Você entrou na sala"
                });
            } catch (e) {
                responder(callback, {
                    sucesso: false,
                    erro: "Erro ao entrar na sala"
                });
            }
        });

        socket.on("sairSala", async (dados, callback) => {
            const salaId = Number(dados?.salaId);

            if (!Number.isInteger(salaId) || salaId <= 0) {
                return responder(callback, {
                    sucesso: false,
                    erro: "Sala inválida"
                });
            }

            await socket.leave(`sala_${salaId}`);

            responder(callback, {
                sucesso: true,
                mensagem: "Você saiu da sala"
            });
        });

        socket.on("enviarMensagem", async (dados, callback) => {
            try {
                const salaId = Number(dados?.salaId);
                const texto = dados?.texto;

                if (
                    typeof texto !== "string" ||
                    !texto.trim() ||
                    texto.trim().length > 2000
                ) {
                    return responder(callback, {
                        sucesso: false,
                        erro: "A mensagem deve ter entre 1 e 2000 caracteres"
                    });
                }

                const acesso = await verificarAcessoSala(
                    usuarioId,
                    salaId
                );

                if (!acesso.permitido) {
                    return responder(callback, {
                        sucesso: false,
                        erro: acesso.erro
                    });
                }

                const nomeSala = `sala_${salaId}`;

                if (!socket.rooms.has(nomeSala)) {
                    return responder(callback, {
                        sucesso: false,
                        erro: "Entre na sala antes de enviar mensagens"
                    });
                }

                const mensagem = await prisma.mensagem.create({
                    data: {
                        texto: texto.trim(),
                        usuarioId,
                        salaId
                    },
                    include: {
                        usuario: {
                            select: {
                                id: true,
                                nome: true,
                                apelido: true,
                                foto: true
                            }
                        }
                    }
                });

                io.to(nomeSala).emit("novaMensagem", mensagem);

                responder(callback, {
                    sucesso: true,
                    mensagem
                });
            } catch (e) {
                responder(callback, {
                    sucesso: false,
                    erro: "Erro ao enviar mensagem"
                });
            }
        });

        socket.on("disconnect", () => {
            console.log(`Usuário ${usuarioId} desconectado`);
        });
    });
};

const responder = (callback, dados) => {
    if (typeof callback === "function") {
        callback(dados);
    }
};

module.exports = iniciarChat;
