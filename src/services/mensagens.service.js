const prisma = require("../data/prisma");

const validarCamposObrigatorios = (dados) => {
    const { texto, usuarioId } = dados;

    if (!texto || !usuarioId) {
        throw new Error("Texto e usuário são obrigatórios.");
    }
};

const buscarMensagemOuErro = async (id) => {
    const mensagem = await prisma.mensagem.findUnique({
        where: { id: Number(id) }
    });

    if (!mensagem) {
        throw new Error("Mensagem não encontrada.");
    }

    return mensagem;
};

module.exports = {
    validarCamposObrigatorios,
    buscarMensagemOuErro
};