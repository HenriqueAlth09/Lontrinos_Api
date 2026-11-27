const prisma = require("../data/prisma");

const validarCamposObrigatorios = (produtoId, usuarioId, quantidade) => {
    if (!produtoId || !usuarioId || !quantidade) {
        throw new Error("Produto, usuário e quantidade são obrigatórios.");
    }
};

const validarQuantidade = (quantidade) => {
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
        throw new Error("Quantidade deve ser um número inteiro positivo.");
    }
};

const validarProdutoE_Estoque = async (produtoId, quantidade) => {
    const produto = await prisma.produto.findUnique({
        where: {
            id: Number(produtoId)
        }
    });

    if (!produto) {
        throw new Error("Produto não encontrado.");
    }

    if (produto.estoque < quantidade) {
        throw new Error("Estoque insuficiente para este pedido.");
    }

    return produto;
};

const calcularValorTotal = (preco, quantidade) => {
    return preco * quantidade;
};

const darBaixaEstoque = async (produtoId, estoqueAtual, quantidade) => {
    await prisma.produto.update({
        where: {
            id: Number(produtoId)
        },
        data: {
            estoque: estoqueAtual - quantidade
        }
    });
};

const buscarPedidoOuErro = async (id) => {
    const pedido = await prisma.pedido.findUnique({
        where: {
            id: Number(id)
        }
    });

    if (!pedido) {
        throw new Error("Pedido não encontrado.");
    }

    return pedido;
};

module.exports = {
    validarCamposObrigatorios,
    validarQuantidade,
    validarProdutoE_Estoque,
    calcularValorTotal,
    darBaixaEstoque,
    buscarPedidoOuErro
};