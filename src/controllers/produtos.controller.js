const prisma = require("../data/prisma");

const {
    validarCamposObrigatorios,
    validarPreco,
    validarEstoque,
    buscarProdutoOuErro
} = require("../services/produtos.service");

const cadastrar = async (req, res) => {
    try {
        validarCamposObrigatorios(req.body);
        validarPreco(req.body.preco);
        validarEstoque(req.body.estoque);

        const item = await prisma.produto.create({
            data: req.body
        });

        res.status(201).json(item);

    } catch (e) {
        res.status(400).json({ erro: e.message });
    }
};

const listar = async (req, res) => {
    try {
        const lista = await prisma.produto.findMany();

        res.json(lista);

    } catch (e) {
        res.status(400).json({ erro: e.message });
    }
};

const buscar = async (req, res) => {
    try {
        const item = await buscarProdutoOuErro(req.params.id);

        res.json(item);

    } catch (e) {
        res.status(400).json({ erro: e.message });
    }
};

const atualizar = async (req, res) => {
    try {
        await buscarProdutoOuErro(req.params.id);

        if (req.body.preco !== undefined) {
            validarPreco(req.body.preco);
        }

        if (req.body.estoque !== undefined) {
            validarEstoque(req.body.estoque);
        }

        const atualizado = await prisma.produto.update({
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
        await buscarProdutoOuErro(req.params.id);

        await prisma.produto.delete({
            where: {
                id: Number(req.params.id)
            }
        });

        res.json({
            mensagem: "Produto excluído"
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