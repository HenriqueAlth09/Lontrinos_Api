const prisma = require("../data/prisma");

const validarCamposObrigatorios = (dados) => {
    const { nome, categoria, descricao, preco, estoque, imagem } = dados;

    if (!nome || !categoria || !descricao || !preco || estoque === undefined || !imagem) {
        throw new Error("Campos obrigatórios faltando.");
    }
};

const validarPreco = (preco) => {
    if (preco <= 0) {
        throw new Error("Preço deve ser positivo.");
    }
};

const validarEstoque = (estoque) => {
    if (!Number.isInteger(estoque) || estoque < 0) {
        throw new Error("Estoque deve ser um número inteiro maior ou igual a zero.");
    }
};

const buscarProdutoOuErro = async (id) => {
    const produto = await prisma.produto.findUnique({
        where: {
            id: Number(id)
        }
    });

    if (!produto) {
        throw new Error("Produto não encontrado.");
    }

    return produto;
};

module.exports = {
    validarCamposObrigatorios,
    validarPreco,
    validarEstoque,
    buscarProdutoOuErro
};