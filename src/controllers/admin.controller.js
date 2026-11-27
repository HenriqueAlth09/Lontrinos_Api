const prisma = require("../data/prisma");
const { criptografarSenha } = require("../services/usuarios.service");

const campos = { id: true, nome: true, cpf: true, email: true, foto: true, bio: true, assinante: true };
const listar = async (_req, res) => {
    try { return res.json(await prisma.usuario.findMany({ select: campos })); }
    catch (e) { return res.status(500).json({ erro: "Erro ao listar usuários" }); }
};
const buscar = async (req, res) => {
    try {
        const usuario = await prisma.usuario.findUnique({ where: { id: Number(req.params.id) }, select: campos });
        return usuario ? res.json(usuario) : res.status(404).json({ erro: "Usuário não encontrado" });
    } catch (e) { return res.status(400).json({ erro: "ID inválido" }); }
};
const atualizar = async (req, res) => {
    try {
        const dados = {};
        for (const campo of ["nome", "cpf", "email", "foto", "bio", "assinante"]) {
            if (req.body[campo] !== undefined) dados[campo] = req.body[campo];
        }
        if (req.body.senha !== undefined) {
            if (typeof req.body.senha !== "string" || req.body.senha.length < 8) {
                return res.status(400).json({ erro: "Senha deve ter ao menos 8 caracteres" });
            }
            dados.senha = await criptografarSenha(req.body.senha);
        }
        return res.json(await prisma.usuario.update({ where: { id: Number(req.params.id) }, data: dados, select: campos }));
    } catch (e) { return res.status(400).json({ erro: "Não foi possível atualizar usuário" }); }
};
const excluir = async (req, res) => {
    try {
        await prisma.usuario.delete({ where: { id: Number(req.params.id) } });
        return res.json({ mensagem: "Usuário excluído" });
    } catch (e) { return res.status(400).json({ erro: "Não foi possível excluir usuário; confira os registros associados" }); }
};
module.exports = { listar, buscar, atualizar, excluir };
