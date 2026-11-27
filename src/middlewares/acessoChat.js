const prisma = require("../data/prisma");
const validate = require("./validaLogin");

const verificarAssinatura = async (usuarioId) => {
    const agora = new Date();

    const assinatura = await prisma.assinatura.findFirst({
        where: {
            usuarioId: Number(usuarioId),
            inicio: {
                lte: agora
            },
            fim: {
                gt: agora
            }
        },
        orderBy: {
            fim: "desc"
        }
    });

    return assinatura !== null;
};

const verificarAcessoSala = async (usuarioId, salaId) => {
    const id = Number(salaId);

    if (!Number.isInteger(id) || id <= 0) {
        return {
            permitido: false,
            status: 400,
            erro: "ID da sala inválido"
        };
    }

    const usuario = await prisma.usuario.findUnique({
        where: {
            id: Number(usuarioId)
        },
        select: {
            id: true
        }
    });

    if (!usuario) {
        return {
            permitido: false,
            status: 401,
            erro: "Usuário não encontrado"
        };
    }

    const sala = await prisma.salaChat.findUnique({
        where: {
            id
        }
    });

    if (!sala) {
        return {
            permitido: false,
            status: 404,
            erro: "Sala não encontrada"
        };
    }

    if (sala.tipo === "GENERO") {
        return {
            permitido: true,
            sala
        };
    }

    if (sala.tipo === "CLUBE") {
        const assinante = await verificarAssinatura(usuarioId);

        if (!assinante) {
            return {
                permitido: false,
                status: 403,
                erro: "Esta sala é exclusiva para assinantes ativos"
            };
        }

        return {
            permitido: true,
            sala
        };
    }

    return {
        permitido: false,
        status: 403,
        erro: "Tipo de sala não permitido"
    };
};

const acessoChat = (req, res, next) => {
    validate(req, res, async () => {
        try {
            const usuarioId = req.headers.user?.id;
            const salaId = req.params.salaId || req.body?.salaId;

            if (!usuarioId) {
                return res.status(401).json({
                    erro: "Usuário não autenticado"
                });
            }

            const acesso = await verificarAcessoSala(
                usuarioId,
                salaId
            );

            if (!acesso.permitido) {
                return res.status(acesso.status).json({
                    erro: acesso.erro
                });
            }

            req.usuarioId = Number(usuarioId);
            req.salaChat = acesso.sala;

            next();
        } catch (e) {
            return res.status(500).json({
                erro: "Erro ao verificar acesso à sala"
            });
        }
    });
};

module.exports = {
    verificarAssinatura,
    verificarAcessoSala,
    acessoChat
};
