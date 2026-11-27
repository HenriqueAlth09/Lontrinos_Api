const prisma = require("../data/prisma");

const {
    validarCamposObrigatorios,
    verificarUsuarioExistente,
    criptografarSenha,
    buscarUsuarioOuErro,
    autenticar
} = require("../services/usuarios.service");

const cadastrar = async (req, res) => {
    try {
        validarCamposObrigatorios(req.body);

        const { nome, cpf, email, senha, apelido } = req.body;
        if (typeof apelido !== "string" || !/^[a-zA-Z0-9_.-]{3,24}$/.test(apelido.trim())) throw new Error("Escolha um @usuário de 3 a 24 caracteres, sem espaços ou acentos");

        await verificarUsuarioExistente(cpf, email);

        const senhaCriptografada = await criptografarSenha(senha);

        const item = await prisma.usuario.create({
            data: {
                nome,
                apelido: apelido.trim().toLowerCase(),
                cpf,
                email,
                senha: senhaCriptografada,
                assinante: false
            }
        });

        const { senha: _senha, ...usuarioSeguro } = item;
        res.status(201).json({ mensagem: "Cadastro realizado com sucesso!", usuario: usuarioSeguro });

    } catch (e) {
        res.status(400).json({ erro: e.code === "P2002" ? "E-mail, CPF ou @usuário já cadastrado" : e.message });
    }
};

const listar = async (req, res) => {
    const lista = await prisma.usuario.findMany({ select: { id: true, nome: true, cpf: true, email: true, foto: true, bio: true, assinante: true } });
    res.json(lista);
};

const buscar = async (req, res) => {
    try {
        const item = await buscarUsuarioOuErro(req.params.id);
        res.json(item);
    } catch (e) {
        res.json({ erro: e.message });
    }
};

const atualizar = async (req, res) => {
    try {
        await buscarUsuarioOuErro(req.params.id);

        const dados = { ...req.body };

        if (dados.senha) {
            dados.senha = await criptografarSenha(dados.senha);
        }

        const atualizado = await prisma.usuario.update({
            where: {
                id: Number(req.params.id)
            },
            data: dados
        });

        res.json(atualizado);

    } catch (e) {
        res.json({ erro: e.message });
    }
};

const excluir = async (req, res) => {
    try {
        await buscarUsuarioOuErro(req.params.id);

        await prisma.usuario.delete({
            where: {
                id: Number(req.params.id)
            }
        });

        res.json({ mensagem: "Usuário excluído" });

    } catch (e) {
        res.json({ erro: e.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, senha } = req.body;

        const token = await autenticar(email, senha);
        const usuario = await prisma.usuario.findUnique({ where: { email } });
        const { senha: _senha, ...usuarioSeguro } = usuario;
        res.json({ mensagem: "Login realizado com sucesso!", token, usuario: usuarioSeguro });

    } catch (e) {
        res.json({ erro: e.message });
    }
};

module.exports = {
    cadastrar,
    listar,
    buscar,
    atualizar,
    excluir,
    login
};