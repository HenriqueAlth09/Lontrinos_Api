const prisma = require("../data/prisma");

const {
    validarDadosObrigatorios,
    validarDataTermino,
    buscarAssinaturaOuErro,
    ativarUsuarioComoAssinante
} = require("../services/assinaturas.service");

const cadastrar = async (req, res) => {
    try {
        const { usuarioId, planoId, fim } = req.body;

        validarDadosObrigatorios(usuarioId, planoId, fim);

        const dataInicio = new Date();
        const termino = validarDataTermino(dataInicio, fim);

        const item = await prisma.assinatura.create({
            data: {
                usuarioId,
                planoId,
                inicio: dataInicio,
                fim: termino
            }
        });

        await ativarUsuarioComoAssinante(usuarioId);

        res.status(201).json(item);

    } catch (e) {
        res.json({ erro: e.message });
    }
};

const listar = async (req, res) => {
    try {
        const lista = await prisma.assinatura.findMany();
        res.json(lista);
    } catch (e) {
        res.json({ erro: e.message });
    }
};

const buscar = async (req, res) => {
    try {
        const item = await buscarAssinaturaOuErro(req.params.id);
        res.json(item);
    } catch (e) {
        res.json({ erro: e.message });
    }
};

const atualizar = async (req, res) => {
    try {
        const assinatura = await buscarAssinaturaOuErro(req.params.id);

        if (req.body.fim) {
            validarDataTermino(assinatura.inicio, req.body.fim);
        }

        const atualizado = await prisma.assinatura.update({
            where: {
                id: Number(req.params.id)
            },
            data: req.body
        });

        res.json(atualizado);

    } catch (e) {
        res.json({ erro: e.message });
    }
};

const excluir = async (req, res) => {
    try {
        await buscarAssinaturaOuErro(req.params.id);

        await prisma.assinatura.delete({
            where: {
                id: Number(req.params.id)
            }
        });

        res.json({ mensagem: "Assinatura excluída" });

    } catch (e) {
        res.json({ erro: e.message });
    }
};

module.exports = {
    cadastrar,
    listar,
    buscar,
    atualizar,
    excluir
};