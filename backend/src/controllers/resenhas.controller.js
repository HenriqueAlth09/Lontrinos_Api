const prisma = require("../data/prisma");
const { validarNota } = require("../services/resenhas.service");

const cadastrar = async (req, res) => {
  try {
    const { titulo, texto, nota, usuarioId, livroId, tituloLivro, spoiler } = req.body;
    if (!titulo || !texto || nota === undefined || !usuarioId || (!livroId && !tituloLivro)) {
      return res.status(400).json({ erro: "Preencha livro, título, comentário e nota. Faça login para publicar." });
    }
    const notaNumero = Number(nota);
    validarNota(notaNumero);
    const usuario = await prisma.usuario.findUnique({ where: { id: Number(usuarioId) } });
    if (!usuario) return res.status(401).json({ erro: "Faça login novamente para publicar a resenha." });
    let livro;
    if (livroId) {
      livro = await prisma.livro.findUnique({ where: { id: Number(livroId) } });
    } else {
      const nomeLivro = String(tituloLivro).trim();
      livro = await prisma.livro.findFirst({ where: { titulo: { equals: nomeLivro } } });
      if (!livro) {
        livro = await prisma.livro.create({ data: { titulo: nomeLivro, autor: "Autor não informado", genero: "Não informado", sinopse: "Livro cadastrado a partir de uma resenha da comunidade.", capa: "", paginas: null, ano: null } });
      }
    }
    if (!livro) return res.status(404).json({ erro: "Livro não encontrado." });
    const item = await prisma.resenha.create({
      data: { titulo: String(titulo).trim(), texto: String(texto).trim(), nota: notaNumero, usuarioId: Number(usuarioId), livroId: livro.id, spoiler: Boolean(spoiler) },
      include: { usuario: { select: { id: true, nome: true, foto: true } }, livro: true }
    });
    return res.status(201).json(item);
  } catch (e) { return res.status(500).json({ erro: e.message }); }
};
const listar = async (_req, res) => {
  try { const lista = await prisma.resenha.findMany({ include: { usuario: { select: { id: true, nome: true, foto: true } }, livro: true }, orderBy: { data: "desc" } }); return res.json(lista); }
  catch (e) { return res.status(500).json({ erro: e.message }); }
};
const buscar = async (req, res) => {
  try { const item = await prisma.resenha.findUnique({ where: { id: Number(req.params.id) }, include: { usuario: { select: { id: true, nome: true, foto: true } }, livro: true } }); if (!item) return res.status(404).json({ erro: "Resenha não encontrada." }); return res.json(item); }
  catch (e) { return res.status(500).json({ erro: e.message }); }
};
const atualizar = async (req, res) => {
  try { if (req.body.nota !== undefined) validarNota(Number(req.body.nota)); const item = await prisma.resenha.update({ where: { id: Number(req.params.id) }, data: req.body }); return res.json(item); }
  catch (e) { return res.status(400).json({ erro: e.message }); }
};
const excluir = async (req, res) => {
  try { await prisma.resenha.delete({ where: { id: Number(req.params.id) } }); return res.json({ mensagem: "Resenha excluída." }); }
  catch (e) { return res.status(400).json({ erro: e.message }); }
};
module.exports = { cadastrar, listar, buscar, atualizar, excluir };
