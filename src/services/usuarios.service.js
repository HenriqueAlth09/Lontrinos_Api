const prisma = require("../data/prisma");
const bcrypt = require("bcrypt");
const jsonwebtoken = require("jsonwebtoken");

const validarCamposObrigatorios = (dados) => {
    const { nome, cpf, email, senha } = dados;

    if (!nome || !cpf || !email || !senha) {
        throw new Error("Campos obrigatórios faltando.");
    }
};

const verificarUsuarioExistente = async (cpf, email) => {
    const existente = await prisma.usuario.findFirst({
        where: {
            OR: [
                { cpf },
                { email }
            ]
        }
    });

    if (existente) {
        throw new Error("Usuário já cadastrado.");
    }
};

const criptografarSenha = async (senha) => {
    return await bcrypt.hash(senha, 10);
};

const buscarUsuarioOuErro = async (id) => {
    const usuario = await prisma.usuario.findUnique({
        where: {
            id: Number(id)
        }
    });

    if (!usuario) {
        throw new Error("Usuário não encontrado.");
    }

    return usuario;
};

const autenticar = async (email, senha) => {
    if (!email || !senha) {
        throw new Error("Email e senha são obrigatórios.");
    }

    const usuario = await prisma.usuario.findUnique({
        where: {
            email
        }
    });

    if (!usuario) {
        throw new Error("Usuário ou senha inválidos.");
    }

    const senhaValida = await bcrypt.compare(
        senha,
        usuario.senha
    );

    if (!senhaValida) {
        throw new Error("Usuário ou senha inválidos.");
    }

    const token = jsonwebtoken.sign(
        {
            id: usuario.id,
            email: usuario.email
        },
        process.env.SECRET_JWT,
        {
            expiresIn: "8h"
        }
    );

    return token;
};

module.exports = {
    validarCamposObrigatorios,
    verificarUsuarioExistente,
    criptografarSenha,
    buscarUsuarioOuErro,
    autenticar
};