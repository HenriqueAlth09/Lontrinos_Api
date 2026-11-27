
const prisma = require("../data/prisma");
const { verificarAcessoSala } = require("../middlewares/acessoChat");

const obterUsuarioId = (req) => {
    return Number(req.headers.user?.id);
};

const verificarMensagem = async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ erro: "ID inválido" });
        return null;
    }

    const mensagem = await prisma.mensagem.findUnique({
        where: { id }
    });

    if (!mensagem) {
        res.status(404).json({ erro: "Mensagem não encontrada" });
        return null;
    }

    if (!mensagem.salaId) {
        res.status(409).json({
            erro: "Mensagem antiga sem sala definida"
        });
        return null;
    }

    const acesso = await verificarAcessoSala(
        obterUsuarioId(req),
        mensagem.salaId
    );

    if (!acesso.permitido) {
        res.status(acesso.status).json({ erro: acesso.erro });
        return null;
    }

    return mensagem;
};

const cadastrar = async (req, res) => {
    try {
        const { texto, salaId } = req.body;
        const usuarioId = obterUsuarioId(req);

        if (typeof texto !== "string" || !texto.trim()) {
            return res.status(400).json({
                erro: "Informe o texto da mensagem"
            });
        }

        if (texto.trim().length > 2000) {
            return res.status(400).json({
                erro: "A mensagem deve ter no máximo 2000 caracteres"
            });
        }

        const acesso = await verificarAcessoSala(usuarioId, salaId);

        if (!acesso.permitido) {
            return res.status(acesso.status).json({
                erro: acesso.erro
            });
        }

        const mensagem = await prisma.mensagem.create({
            data: {
                texto: texto.trim(),
                usuarioId,
                salaId: Number(salaId)
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

        return res.status(201).json(mensagem);
    } catch (e) {
        return res.status(500).json({
            erro: "Erro ao cadastrar mensagem"
        });
    }
};

const listar = async (req, res) => {
    try {
        const usuarioId = obterUsuarioId(req);
        const salaId = Number(req.query.salaId);

        const acesso = await verificarAcessoSala(usuarioId, salaId);

        if (!acesso.permitido) {
            return res.status(acesso.status).json({
                erro: acesso.erro
            });
        }

        const mensagens = await prisma.mensagem.findMany({
            where: {
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
            },
            orderBy: [
                { data: "asc" },
                { id: "asc" }
            ],
            take: 100
        });

        return res.json(mensagens);
    } catch (e) {
        return res.status(500).json({
            erro: "Erro ao listar mensagens"
        });
    }
};

const buscar = async (req, res) => {
    try {
        const mensagem = await verificarMensagem(req, res);

        if (!mensagem) return;

        const resultado = await prisma.mensagem.findUnique({
            where: {
                id: mensagem.id
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

        return res.json(resultado);
    } catch (e) {
        return res.status(500).json({
            erro: "Erro ao buscar mensagem"
        });
    }
};

const atualizar = async (req, res) => {
    try {
        const mensagem = await verificarMensagem(req, res);

        if (!mensagem) return;

        const usuarioId = obterUsuarioId(req);

        if (mensagem.usuarioId !== usuarioId) {
            return res.status(403).json({
                erro: "Você só pode editar suas próprias mensagens"
            });
        }

        const { texto } = req.body;

        if (
            typeof texto !== "string" ||
            !texto.trim() ||
            texto.trim().length > 2000
        ) {
            return res.status(400).json({
                erro: "Informe um texto válido de até 2000 caracteres"
            });
        }

        const atualizada = await prisma.mensagem.update({
            where: {
                id: mensagem.id
            },
            data: {
                texto: texto.trim()
            }
        });

        return res.json(atualizada);
    } catch (e) {
        return res.status(500).json({
            erro: "Erro ao atualizar mensagem"
        });
    }
};

const excluir = async (req, res) => {
    try {
        const mensagem = await verificarMensagem(req, res);

        if (!mensagem) return;

        const usuarioId = obterUsuarioId(req);

        if (mensagem.usuarioId !== usuarioId) {
            return res.status(403).json({
                erro: "Você só pode excluir suas próprias mensagens"
            });
        }

        await prisma.mensagem.delete({
            where: {
                id: mensagem.id
            }
        });

        return res.json({
            mensagem: "Mensagem excluída com sucesso"
        });
    } catch (e) {
        return res.status(500).json({
            erro: "Erro ao excluir mensagem"
        });
    }
};

module.exports = {
    cadastrar,
    listar,
    buscar,
    atualizar,
    excluir
};
