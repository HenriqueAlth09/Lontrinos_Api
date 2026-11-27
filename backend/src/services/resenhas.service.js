const prisma = require("../data/prisma");

const validarCamposObrigatorios = (dados) => {
    const { titulo, texto, nota, usuarioId, livroId } = dados;

    if (!titulo || !texto || nota === undefined || !usuarioId || !livroId) {
        throw new Error("Campos obrigatórios faltando.");
    }
};

const validarNota = (nota) => {
    if (!Number.isInteger(nota)) {
        throw new Error("Nota deve ser um número inteiro.");
    }

    if (nota < 0 || nota > 10) {
        throw new Error("A nota deve estar entre 0 e 10.");
    }
};

const buscarResenhaOuErro = async (id) => {
    const resenha = await prisma.resenha.findUnique({
        where: {
            id: Number(id)
        }
    });

    if (!resenha) {
        throw new Error("Resenha não encontrada.");
    }

    return resenha;
};

module.exports = {
    validarCamposObrigatorios,
    validarNota,
    buscarResenhaOuErro
};