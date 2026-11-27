const prisma = require("../data/prisma");

const {
    validarDadosObrigatorios,
    validarOpcoes,
    buscarEnqueteOuErro
} = require("../services/enquetes.service");

const cadastrar = async (req, res) => {
    try {
        const { pergunta, opcoes } = req.body;

        validarDadosObrigatorios(pergunta, opcoes);
        validarOpcoes(opcoes);

        const item = await prisma.enquete.create({
            data: {
                pergunta,
                opcoes
            }
        });

        res.json(item);

    } catch (e) {
        res.json({ erro: e.message });
    }
};

const listar = async (req, res) => {
    try {
        const lista = await prisma.enquete.findMany();
        res.json(lista);
    } catch (e) {
        res.json({ erro: e.message });
    }
};

const buscar = async (req, res) => {
    try {
        const item = await buscarEnqueteOuErro(req.params.id);
        res.json(item);
    } catch (e) {
        res.json({ erro: e.message });
    }
};

const atualizar = async (req, res) => {
    try {
        await buscarEnqueteOuErro(req.params.id);

        if (req.body.opcoes !== undefined) {
            validarOpcoes(req.body.opcoes);
        }

        const atualizado = await prisma.enquete.update({
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
        await buscarEnqueteOuErro(req.params.id);

        await prisma.enquete.delete({
            where: {
                id: Number(req.params.id)
            }
        });

        res.json({ mensagem: "Enquete excluída" });

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