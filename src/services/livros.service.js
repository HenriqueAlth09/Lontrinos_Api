const prisma = require("../data/prisma");

const validarCamposObrigatorios = (dados) => {
    const { titulo, autor, genero, sinopse, capa } = dados;

    if (!titulo || !autor || !genero || !sinopse || !capa) {
        throw new Error("Campos obrigatórios faltando.");
    }
};

const buscarLivroOuErro = async (id) => {
    const livro = await prisma.livro.findUnique({
        where: {
            id: Number(id)
        }
    });

    if (!livro) {
        throw new Error("Livro não encontrado.");
    }

    return livro;
};

module.exports = {
    validarCamposObrigatorios,
    buscarLivroOuErro
};