const prisma = require("../data/prisma");

const validarDadosObrigatorios = (usuarioId, planoId, fim) => {
    if (!usuarioId || !planoId || !fim) {
        throw new Error("Usuário, plano e data de término são obrigatórios.");
    }
};

const validarDataTermino = (dataInicio, fim) => {
    const termino = new Date(fim);

    if (isNaN(termino.getTime())) {
        throw new Error("Data de término inválida.");
    }

    if (termino <= new Date(dataInicio)) {
        throw new Error("Data de término deve ser maior que a data de início.");
    }

    return termino;
};

const buscarAssinaturaOuErro = async (id) => {
    const assinatura = await prisma.assinatura.findUnique({
        where: {
            id: Number(id)
        }
    });

    if (!assinatura) {
        throw new Error("Assinatura não encontrada.");
    }

    return assinatura;
};

const ativarUsuarioComoAssinante = async (usuarioId) => {
    await prisma.usuario.update({
        where: {
            id: Number(usuarioId)
        },
        data: {
            assinante: true
        }
    });
};

module.exports = {
    validarDadosObrigatorios,
    validarDataTermino,
    buscarAssinaturaOuErro,
    ativarUsuarioComoAssinante
};