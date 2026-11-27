const prisma = require("../data/prisma");

const validarDadosObrigatorios = (pergunta, opcoes) => {
    if (!pergunta || !opcoes || !Array.isArray(opcoes) || opcoes.length < 2) {
        throw new Error("Pergunta e pelo menos duas opções são obrigatórias.");
    }
};

const validarOpcoes = (opcoes) => {
    if (!Array.isArray(opcoes) || opcoes.length < 2) {
        throw new Error("A enquete deve ter pelo menos duas opções.");
    }
};

const buscarEnqueteOuErro = async (id) => {
    const enquete = await prisma.enquete.findUnique({
        where: {
            id: Number(id)
        }
    });

    if (!enquete) {
        throw new Error("Enquete não encontrada.");
    }

    return enquete;
};

module.exports = {
    validarDadosObrigatorios,
    validarOpcoes,
    buscarEnqueteOuErro
};