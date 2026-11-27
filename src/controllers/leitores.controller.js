const prisma = require("../data/prisma");
const { cadastrar, login } = require("./usuarios.controller");
const { criptografarSenha } = require("../services/usuarios.service");

const campos = { id: true, nome: true, apelido: true, email: true, foto: true, bio: true, livroFavorito: true, lendoAtualmente: true, generosFavoritos: true, assinante: true, apelidoAlteradoEm: true, nomeAlteradoEm: true };

const perfil = async (req, res) => {
    try {
        const usuario = await prisma.usuario.findUnique({ where: { id: req.headers.user.id }, select: campos });
        if (!usuario) return res.status(404).json({ erro: "Leitor não encontrado" });
        return res.json(usuario);
    } catch (e) {
        return res.status(500).json({ erro: "Erro ao buscar perfil" });
    }
};

const atualizarPerfil = async (req, res) => {
    try {
        const id = Number(req.headers.user?.id);
        const atual = await prisma.usuario.findUnique({ where: { id }, select: campos });
        if (!atual) return res.status(404).json({ erro: "Leitor não encontrado" });
        const dados = {};
        const agora = new Date();
        const espera = (ultima, dias) => ultima && agora.getTime() - new Date(ultima).getTime() < dias * 86400000;
        if (req.body.nome !== undefined) {
            const nome = String(req.body.nome).trim();
            if (nome.length < 2 || nome.length > 80) return res.status(400).json({ erro: "O nome deve ter de 2 a 80 caracteres" });
            if (nome !== atual.nome) {
                if (espera(atual.nomeAlteradoEm, 7)) return res.status(429).json({ erro: "O nome só pode ser alterado a cada 7 dias" });
                dados.nome = nome;
                dados.nomeAlteradoEm = agora;
            }
        }
        if (req.body.apelido !== undefined) {
            const apelido = String(req.body.apelido).trim();
            if (!/^[\p{L}\p{N}_.-]{3,24}$/u.test(apelido)) return res.status(400).json({ erro: "Nome de usuário inválido: use de 3 a 24 caracteres, sem espaços" });
            if (apelido !== atual.apelido) {
                if (espera(atual.apelidoAlteradoEm, 30)) return res.status(429).json({ erro: "O nome de usuário só pode ser alterado a cada 30 dias" });
                dados.apelido = apelido;
                dados.apelidoAlteradoEm = agora;
            }
        }
        if (req.body.foto !== undefined) {
            const foto = req.body.foto;
            if (foto !== null && (typeof foto !== "string" || foto.length > 750000 || !/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/]+={0,2}$/.test(foto))) {
                return res.status(400).json({ erro: "Escolha uma imagem JPG, PNG ou WebP de até 500 KB" });
            }
            dados.foto = foto;
        }
        if (req.body.bio !== undefined) dados.bio = String(req.body.bio || "").trim().slice(0, 150);
        if (req.body.livroFavorito !== undefined) dados.livroFavorito = String(req.body.livroFavorito || "").trim().slice(0, 120);
        if (req.body.lendoAtualmente !== undefined) dados.lendoAtualmente = String(req.body.lendoAtualmente || "").trim().slice(0, 120);
        if (req.body.generosFavoritos !== undefined) {
            if (!Array.isArray(req.body.generosFavoritos) || req.body.generosFavoritos.length > 3 || req.body.generosFavoritos.some(g => typeof g !== "string" || g.length > 40)) return res.status(400).json({ erro: "Escolha até 3 gêneros favoritos" });
            dados.generosFavoritos = JSON.stringify([...new Set(req.body.generosFavoritos)]);
        }
        if (req.body.senha !== undefined) {
            if (typeof req.body.senha !== "string" || req.body.senha.length < 8) return res.status(400).json({ erro: "A senha precisa ter ao menos 8 caracteres" });
            dados.senha = await criptografarSenha(req.body.senha);
        }
        const usuario = await prisma.usuario.update({ where: { id }, data: dados, select: campos });
        return res.json(usuario);
    } catch (e) {
        return res.status(400).json({ erro: e.code === "P2002" ? "Esse nome de usuário já está em uso" : "Não foi possível atualizar o perfil" });
    }
};

const excluirConta = async (req, res) => {
    if (req.body?.confirmacao !== "EXCLUIR") return res.status(400).json({ erro: "Confirmação necessária" });
    const id = Number(req.headers.user?.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(401).json({ erro: "Sessão inválida" });
    try {
        await prisma.$transaction(async tx => {
            const existente = await tx.usuario.findUnique({ where: { id }, select: { id: true } });
            if (!existente) throw new Error("Conta não encontrada");
            await tx.mensagem.deleteMany({ where: { usuarioId: id } });
            await tx.resenha.deleteMany({ where: { usuarioId: id } });
            await tx.assinatura.deleteMany({ where: { usuarioId: id } });
            await tx.pedido.deleteMany({ where: { usuarioId: id } });
            await tx.usuario.delete({ where: { id } });
        });
        return res.json({ mensagem: "Conta excluída" });
    } catch (e) { return res.status(400).json({ erro: "Não foi possível excluir a conta" }); }
};

module.exports = { cadastrar, login, perfil, atualizarPerfil, excluirConta };
