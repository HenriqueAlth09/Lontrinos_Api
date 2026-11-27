const prisma = require("../src/data/prisma");

const generos = [
  "Fantasia", "Romance", "Suspense e Mistério", "Terror",
  "Ficção Científica", "Aventura", "Drama", "Clássicos",
  "Romance Histórico", "Distopia", "Poesia", "Contos",
  "Crônicas", "Biografia", "Não Ficção", "Jovem Adulto",
  "Policial", "Humor", "Ficção Contemporânea"
];

const normalizar = valor => valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

async function main() {
  const salas = await prisma.salaChat.findMany({ where: { tipo: "GENERO" }, select: { nome: true, genero: true } });
  const existentes = new Set(salas.map(s => normalizar(s.genero || s.nome)));
  let criados = 0;
  for (const genero of generos) {
    if (existentes.has(normalizar(genero))) continue;
    await prisma.salaChat.create({ data: { nome: genero, tipo: "GENERO", genero } });
    existentes.add(normalizar(genero));
    criados++;
    console.log(`Canal criado: ${genero}`);
  }
  console.log(`Concluído: ${criados} canais criados, ${generos.length - criados} já existentes.`);
}

main().catch(e => { console.error("Erro ao criar canais:", e.message); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
