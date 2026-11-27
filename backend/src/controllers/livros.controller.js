const prisma = require("../data/prisma");

const {
    validarCamposObrigatorios,
    buscarLivroOuErro
} = require("../services/livros.service");

const cadastrar = async (req, res) => {
    try {
        validarCamposObrigatorios(req.body);

        const item = await prisma.livro.create({
            data: req.body
        });

        res.status(201).json(item);

    } catch (e) {
        res.status(400).json({ erro: e.message });
    }
};

const listar = async (req, res) => {
    try {
        const lista = await prisma.livro.findMany();

        res.json(lista);

    } catch (e) {
        res.status(400).json({ erro: e.message });
    }
};

const buscar = async (req, res) => {
    try {
        const item = await buscarLivroOuErro(req.params.id);

        res.json(item);

    } catch (e) {
        res.status(400).json({ erro: e.message });
    }
};

const atualizar = async (req, res) => {
    try {
        await buscarLivroOuErro(req.params.id);

        validarCamposObrigatorios(req.body);

        const atualizado = await prisma.livro.update({
            where: {
                id: Number(req.params.id)
            },
            data: req.body
        });

        res.json(atualizado);

    } catch (e) {
        res.status(400).json({ erro: e.message });
    }
};

const excluir = async (req, res) => {
    try {
        await buscarLivroOuErro(req.params.id);

        await prisma.livro.delete({
            where: {
                id: Number(req.params.id)
            }
        });

        res.json({
            mensagem: "Livro excluído"
        });

    } catch (e) {
        res.status(400).json({ erro: e.message });
    }
};

module.exports = {
    cadastrar,
    listar,
    buscar,
    atualizar,
    excluir
};