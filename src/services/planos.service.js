const prisma = require("../data/prisma");

const validarCamposObrigatorios = (dados) => {
    const { nome, preco, duracao, beneficios } = dados;

    if (!nome || !preco || !duracao || !beneficios) {
        throw new Error("Campos obrigatórios faltando.");
    }
};

const validarPreco = (preco) => {
    if (preco <= 0) {
        throw new Error("Preço deve ser positivo.");
    }
};

const validarDuracao = (duracao) => {
    if (!Number.isInteger(duracao) || duracao <= 0) {
        throw new Error("Duração deve ser um número inteiro positivo.");
    }
};

const buscarPlanoOuErro = async (id) => {
    const plano = await prisma.plano.findUnique({
        where: {
            id: Number(id)
        }
    });

    if (!plano) {
        throw new Error("Plano não encontrado.");
    }

    return plano;
};

module.exports = {
    validarCamposObrigatorios,
    validarPreco,
    validarDuracao,
    buscarPlanoOuErro
};