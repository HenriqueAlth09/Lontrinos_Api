const prisma = require("../data/prisma");

const {
    validarCamposObrigatorios,
    validarPreco,
    validarDuracao,
    buscarPlanoOuErro
} = require("../services/planos.service");

const cadastrar = async (req, res) => {
    try {
        validarCamposObrigatorios(req.body);
        validarPreco(req.body.preco);
        validarDuracao(req.body.duracao);

        const item = await prisma.plano.create({
            data: req.body
        });

        res.json(item);

    } catch (e) {
        res.json({ erro: e.message });
    }
};

const listar = async (req, res) => {
    try {
        const lista = await prisma.plano.findMany();
        res.json(lista);
    } catch (e) {
        res.json({ erro: e.message });
    }
};

const buscar = async (req, res) => {
    try {
        const item = await buscarPlanoOuErro(req.params.id);
        res.json(item);
    } catch (e) {
        res.json({ erro: e.message });
    }
};

const atualizar = async (req, res) => {
    try {
        await buscarPlanoOuErro(req.params.id);

        if (req.body.preco !== undefined) {
            validarPreco(req.body.preco);
        }

        if (req.body.duracao !== undefined) {
            validarDuracao(req.body.duracao);
        }

        const atualizado = await prisma.plano.update({
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
        await buscarPlanoOuErro(req.params.id);

        await prisma.plano.delete({
            where: {
                id: Number(req.params.id)
            }
        });

        res.json({ mensagem: "Plano excluído" });

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