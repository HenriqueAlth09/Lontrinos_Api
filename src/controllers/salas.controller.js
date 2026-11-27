
const prisma = require("../data/prisma");

const cadastrar = async (req, res) => {
    try {
        const { nome, tipo, genero, livroId } = req.body;

        if (!nome || typeof nome !== "string" || !nome.trim()) {
            return res.status(400).json({
                erro: "Informe o nome da sala"
            });
        }

        if (!["GENERO", "CLUBE"].includes(tipo)) {
            return res.status(400).json({
                erro: "O tipo deve ser GENERO ou CLUBE"
            });
        }

        if (tipo === "GENERO" && (!genero || typeof genero !== "string" || !genero.trim())) {
            return res.status(400).json({
                erro: "Informe o gênero literário"
            });
        }

        if (tipo === "CLUBE" && (!Number.isInteger(livroId) || livroId <= 0)) {
            return res.status(400).json({
                erro: "Informe um livroId válido"
            });
        }

        if (tipo === "CLUBE") {
            const livro = await prisma.livro.findUnique({
                where: { id: livroId }
            });

            if (!livro) {
                return res.status(404).json({
                    erro: "Livro não encontrado"
                });
            }
        }

        const sala = await prisma.salaChat.create({
            data: {
                nome: nome.trim(),
                tipo,
                genero: tipo === "GENERO" ? genero.trim() : null,
                livroId: tipo === "CLUBE" ? livroId : null
            }
        });

        return res.status(201).json(sala);
    } catch (e) {
        return res.status(500).json({
            erro: "Erro ao cadastrar sala"
        });
    }
};

const listar = async (req, res) => {
    try {
        const salas = await prisma.salaChat.findMany({
            include: {
                livro: {
                    select: {
                        id: true,
                        titulo: true,
                        autor: true,
                        capa: true
                    }
                },
                _count: {
                    select: {
                        mensagens: true
                    }
                }
            },
            orderBy: {
                nome: "asc"
            }
        });

        return res.json(salas);
    } catch (e) {
        return res.status(500).json({
            erro: "Erro ao listar salas"
        });
    }
};

const buscar = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "ID inválido"
            });
        }

        const sala = await prisma.salaChat.findUnique({
            where: { id },
            include: {
                livro: {
                    select: {
                        id: true,
                        titulo: true,
                        autor: true,
                        capa: true
                    }
                },
                _count: {
                    select: {
                        mensagens: true
                    }
                }
            }
        });

        if (!sala) {
            return res.status(404).json({
                erro: "Sala não encontrada"
            });
        }

        return res.json(sala);
    } catch (e) {
        return res.status(500).json({
            erro: "Erro ao buscar sala"
        });
    }
};

const atualizar = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { nome } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "ID inválido"
            });
        }

        if (typeof nome !== "string" || !nome.trim()) {
            return res.status(400).json({
                erro: "Informe um nome válido"
            });
        }

        const sala = await prisma.salaChat.findUnique({
            where: { id }
        });

        if (!sala) {
            return res.status(404).json({
                erro: "Sala não encontrada"
            });
        }

        const atualizada = await prisma.salaChat.update({
            where: { id },
            data: {
                nome: nome.trim()
            }
        });

        return res.json(atualizada);
    } catch (e) {
        return res.status(500).json({
            erro: "Erro ao atualizar sala"
        });
    }
};

const excluir = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "ID inválido"
            });
        }

        const sala = await prisma.salaChat.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        mensagens: true
                    }
                }
            }
        });

        if (!sala) {
            return res.status(404).json({
                erro: "Sala não encontrada"
            });
        }

        if (sala._count.mensagens > 0) {
            return res.status(409).json({
                erro: "Não é possível excluir uma sala com mensagens"
            });
        }

        await prisma.salaChat.delete({
            where: { id }
        });

        return res.json({
            mensagem: "Sala excluída com sucesso"
        });
    } catch (e) {
        return res.status(500).json({
            erro: "Erro ao excluir sala"
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
