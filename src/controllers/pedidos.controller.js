const prisma = require("../data/prisma");

const {
    validarCamposObrigatorios,
    validarQuantidade,
    validarProdutoE_Estoque,
    calcularValorTotal,
    darBaixaEstoque,
    buscarPedidoOuErro
} = require("../services/pedidos.service");

const cadastrar = async (req, res) => {
    try {
        const { produtoId, usuarioId, quantidade } = req.body;

        validarCamposObrigatorios(produtoId, usuarioId, quantidade);
        validarQuantidade(quantidade);

        const produto = await validarProdutoE_Estoque(produtoId, quantidade);

        const valorTotal = calcularValorTotal(produto.preco, quantidade);

        const item = await prisma.pedido.create({
            data: {
                produtoId,
                usuarioId,
                quantidade,
                valorTotal,
                data: new Date()
            }
        });

        await darBaixaEstoque(produtoId, produto.estoque, quantidade);

        res.json(item);

    } catch (e) {
        res.json({ erro: e.message });
    }
};

const listar = async (req, res) => {
    try {
        const lista = await prisma.pedido.findMany();
        res.json(lista);
    } catch (e) {
        res.json({ erro: e.message });
    }
};

const buscar = async (req, res) => {
    try {
        const item = await buscarPedidoOuErro(req.params.id);
        res.json(item);
    } catch (e) {
        res.json({ erro: e.message });
    }
};

const atualizar = async (req, res) => {
    try {
        await buscarPedidoOuErro(req.params.id);

        if (req.body.quantidade !== undefined) {
            validarQuantidade(req.body.quantidade);
        }

        const atualizado = await prisma.pedido.update({
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
        await buscarPedidoOuErro(req.params.id);

        await prisma.pedido.delete({
            where: {
                id: Number(req.params.id)
            }
        });

        res.json({ mensagem: "Pedido excluído" });

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