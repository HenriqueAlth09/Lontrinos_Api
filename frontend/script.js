const API_URL = "http://localhost:3000/api";

const getUsuario = () => {
  try { return JSON.parse(localStorage.getItem("usuarioLogado") || "null"); }
  catch { return null; }
};
const getToken = () => localStorage.getItem("tokenLontrinos");
const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));
async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (getToken()) headers.Authorization = `Bearer ${getToken()}`;
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.erro) throw new Error(data.erro || data.mensagem || "Não foi possível concluir a operação.");
  return data;
}

const formatarPreco = valor => Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const imagemValida = (valor, fallback) => valor ? escapeHTML(valor) : fallback;
async function carregarLivrosFrontend() {
  const grade = document.getElementById("gradeLivros");
  if (!grade) return;
  try {
    const livros = await api("/livros/listar");
    if (!Array.isArray(livros)) throw new Error("A API não retornou uma lista de livros.");
    grade.replaceChildren();
    if (!livros.length) { grade.innerHTML = "<p class='estado-carregamento'>Nenhum livro cadastrado no banco de dados.</p>"; return; }
    livros.forEach(livro => {
      const card = document.createElement("article"); card.className = "livro-card";
      card.dataset.busca = `${livro.titulo || ""} ${livro.autor || ""} ${livro.genero || ""}`;
      const img = document.createElement("img"); img.src = livro.capa || "assets/logoLontrino.png"; img.alt = `Capa de ${livro.titulo || "livro"}`; img.onerror = () => { img.onerror = null; img.src = "assets/logoLontrino.png"; };
      const titulo = document.createElement("h2"); titulo.textContent = livro.titulo || "Livro sem título";
      const autor = document.createElement("p"); autor.className = "livro-autor"; autor.textContent = livro.autor || "Autor não informado";
      card.append(img, titulo, autor);
      card.addEventListener("click", () => { document.getElementById("tituloSinopse").textContent = livro.titulo || "Livro"; document.getElementById("textoSinopse").textContent = livro.sinopse || "Sinopse não informada."; document.getElementById("modalSinopseFundo").hidden = false; });
      grade.appendChild(card);
    });
    const busca = document.getElementById("buscaLivros");
    if (busca) { busca.value = new URLSearchParams(location.search).get("busca") || busca.value; filtrarLivros(busca.value); }
  } catch (error) { console.error(error); grade.innerHTML = `<p class="estado-carregamento erro-api">${escapeHTML(error.message)}. Verifique o backend e o banco.</p>`; }
}
function filtrarLivros(termo = "") {
  const grade = document.getElementById("gradeLivros"); if (!grade) return;
  const q = termo.toLocaleLowerCase("pt-BR");
  grade.querySelectorAll(".livro-card").forEach(card => card.hidden = !card.dataset.busca.toLocaleLowerCase("pt-BR").includes(q));
}
async function carregarProdutosFrontend() {
  const grade = document.getElementById("gridProdutos"); if (!grade) return;
  try {
    const produtos = await api("/produtos/listar");
    if (!Array.isArray(produtos)) throw new Error("A API não retornou uma lista de produtos.");
    grade.replaceChildren();
    if (!produtos.length) { grade.innerHTML = "<p class='estado-carregamento'>Nenhum produto cadastrado no banco de dados.</p>"; atualizarContadorProdutos(); return; }
    produtos.forEach(produto => {
      const card = document.createElement("article"); card.className = "produto-card"; card.dataset.cat = produto.categoria || ""; card.dataset.nome = produto.nome || "";
      const area = document.createElement("div"); area.className = "produto-img";
      const img = document.createElement("img"); img.src = produto.imagem || "assets/logoLontrino.png"; img.alt = produto.nome || "Produto"; img.onerror = () => { img.onerror = null; img.src = "assets/logoLontrino.png"; }; area.appendChild(img);
      const info = document.createElement("div"); info.className = "produto-info";
      const cat = document.createElement("span"); cat.className = "categoria"; cat.textContent = produto.categoria || "PRODUTO";
      const nome = document.createElement("h3"); nome.textContent = produto.nome || "Produto sem nome";
      const desc = document.createElement("p"); desc.textContent = produto.descricao || "";
      const preco = document.createElement("p"); preco.className = "preco"; preco.textContent = formatarPreco(produto.preco);
      const acoes = document.createElement("div"); acoes.className = "produto-acoes";
      const carrinho = document.createElement("button"); carrinho.className = "btn-carrinho"; carrinho.textContent = "Adicionar ao carrinho"; carrinho.disabled = Number(produto.estoque) <= 0;
      carrinho.addEventListener("click", () => { const items = lerListaLocal("lontrinosCarrinho"); const existente = items.find(i => i.id === produto.id); if (existente) existente.quantidade = (existente.quantidade || 1) + 1; else items.push({ id: produto.id, nome: produto.nome, preco: formatarPreco(produto.preco), imagem: produto.imagem, quantidade: 1, tipo: "Carrinho" }); localStorage.setItem("lontrinosCarrinho", JSON.stringify(items)); alert("Produto adicionado ao carrinho!"); });
      const favorito = document.createElement("button"); favorito.className = "btn-favorito"; favorito.type = "button"; favorito.textContent = "♡"; favorito.setAttribute("aria-label", "Favoritar produto");
      const favoritos = lerListaLocal("lontrinosFavoritos"); if (favoritos.some(i => i.id === produto.id)) { favorito.textContent = "♥"; favorito.classList.add("favoritado"); }
      favorito.addEventListener("click", () => { const lista = lerListaLocal("lontrinosFavoritos"); const idx = lista.findIndex(i => i.id === produto.id); if (idx >= 0) { lista.splice(idx,1); favorito.textContent = "♡"; favorito.classList.remove("favoritado"); } else { lista.push({ id: produto.id, nome: produto.nome, preco: formatarPreco(produto.preco), imagem: produto.imagem, tipo: "Favorito" }); favorito.textContent = "♥"; favorito.classList.add("favoritado"); } localStorage.setItem("lontrinosFavoritos", JSON.stringify(lista)); });
      acoes.append(carrinho, favorito); info.append(cat, nome, desc, preco, acoes); card.append(area, info); grade.appendChild(card);
    });
    atualizarContadorProdutos();
    const busca = document.getElementById("buscaProdutos"); if (busca) { busca.value = new URLSearchParams(location.search).get("busca") || busca.value; filtrarProdutosFrontend(busca.value); }
  } catch (error) { console.error(error); grade.innerHTML = `<p class="estado-carregamento erro-api">${escapeHTML(error.message)}. Verifique o backend e o banco.</p>`; }
}
function lerListaLocal(chave) { try { const valor = JSON.parse(localStorage.getItem(chave) || "[]"); return Array.isArray(valor) ? valor : []; } catch { return []; } }
function atualizarContadorProdutos() { const contador = document.querySelector(".qtd-produtos"); const cards = [...document.querySelectorAll("#gridProdutos .produto-card")].filter(c => !c.hidden); if (contador) contador.textContent = `${cards.length} produto${cards.length === 1 ? "" : "s"}`; }
function filtrarProdutosFrontend(termo = "") { const q = termo.toLocaleLowerCase("pt-BR"); document.querySelectorAll("#gridProdutos .produto-card").forEach(card => card.hidden = !card.textContent.toLocaleLowerCase("pt-BR").includes(q)); atualizarContadorProdutos(); }

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("gradeLivros")) carregarLivrosFrontend();
  if (document.getElementById("gridProdutos")) carregarProdutosFrontend();
  document.getElementById("buscaLivros")?.addEventListener("input", event => filtrarLivros(event.target.value));
  document.getElementById("buscaProdutos")?.addEventListener("input", event => filtrarProdutosFrontend(event.target.value));

  const path = location.pathname.toLowerCase();
  const usuario = getUsuario();
  if (path.endsWith("/clube.html") && (!usuario || !usuario.id)) {
    alert("Você precisa fazer login para entrar no clube.");
    location.replace("login.html");
    return;
  }
  document.querySelectorAll('a[href="clube.html"], a[href="perfil.html"], a[href="chat.html"]').forEach(link => {
    link.addEventListener("click", event => {
      if ((link.getAttribute("href") === "clube.html" || link.getAttribute("href") === "perfil.html" || link.getAttribute("href") === "chat.html") && !getUsuario()) {
        event.preventDefault();
        alert("Faça login para acessar essa área.");
        location.href = "login.html";
      }
    });
  });
  const loginForm = document.getElementById("login-form") || document.getElementById("loginForm");
  if (loginForm) loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    const email = document.getElementById("email")?.value.trim();
    const senha = document.getElementById("senha")?.value;
    if (!email || !senha) return alert("Preencha o e-mail e a senha.");
    const button = loginForm.querySelector('[type="submit"]');
    if (button) button.disabled = true;
    try {
      const data = await api("/usuarios/login", { method: "POST", body: JSON.stringify({ email, senha }) });
      if (!data.usuario?.id || !data.token) throw new Error("O servidor não retornou os dados da conta. Confira a API.");
      localStorage.setItem("usuarioLogado", JSON.stringify(data.usuario));
      localStorage.setItem("tokenLontrinos", data.token);
      alert("Login realizado com sucesso!");
      location.href = "clube.html";
    } catch (error) {
      alert(error.message || "Não foi possível conectar ao servidor. Confira se o backend está rodando.");
    } finally { if (button) button.disabled = false; }
  });
  const cadastroForm = document.getElementById("cadastro-form");
  if (cadastroForm) cadastroForm.addEventListener("submit", async event => {
    event.preventDefault();
    const nome = document.getElementById("nome")?.value.trim();
    const cpf = (document.getElementById("cpf")?.value || "").replace(/\D/g, "");
    const apelido = document.getElementById("apelido")?.value.trim().toLowerCase();
    const email = document.getElementById("email")?.value.trim();
    const senha = document.getElementById("senha")?.value;
    const confirmar = document.getElementById("confirmar-senha")?.value;
    if (!nome || !apelido || !cpf || !email || !senha || !confirmar) return alert("Preencha todos os campos.");
    if (senha !== confirmar) return alert("As senhas não coincidem.");
    if (senha.length < 6) return alert("A senha deve ter pelo menos 6 caracteres.");
    try {
      await api("/usuarios", { method: "POST", body: JSON.stringify({ nome, apelido, cpf, email, senha }) });
      alert("Cadastro realizado com sucesso! Agora faça login.");
      location.href = "login.html";
    } catch (error) { alert(error.message || "Erro ao realizar cadastro."); }
  });
  document.querySelectorAll("#btnSair, .btn-sair, [data-logout]").forEach(button => {
    button.addEventListener("click", () => {
      localStorage.removeItem("usuarioLogado");
      localStorage.removeItem("tokenLontrinos");
      location.href = "index.html";
    });
  });
  document.querySelectorAll('.header-itens img.perfil, .header-itens img[alt="Perfil"], .header-itens img[alt="perfil"]').forEach(icon => {
    icon.style.cursor = "pointer";
    icon.addEventListener("click", () => location.href = getUsuario() ? "perfil.html" : "login.html");
  });
  document.querySelectorAll(".periodo-btn").forEach(botao => botao.addEventListener("click", () => {
    document.querySelectorAll(".periodo-btn").forEach(item => item.classList.toggle("ativo", item === botao));
    const periodo = botao.dataset.periodo;
    document.querySelectorAll(".card-plano").forEach(card => {
      const base = Number(card.dataset.mensal);
      const valor = card.querySelector(".preco .valor");
      const mes = card.querySelector(".preco .mes");
      const detalhe = card.querySelector(".preco-total-detalhe");
      if (!valor || !Number.isFinite(base)) return;
      const meses = periodo === "anual" ? 12 : periodo === "semestral" ? 6 : 1;
      const total = base * meses * (periodo === "anual" ? .86 : periodo === "semestral" ? .93 : 1);
      valor.textContent = (total / meses).toFixed(2).replace(".", ",");
      if (mes) mes.textContent = "/mês";
      if (detalhe) detalhe.textContent = meses === 1 ? "" : `Total ${periodo}: R$ ${total.toFixed(2).replace(".", ",")} (cobrado ${meses === 6 ? "a cada 6 meses" : "anualmente"})`;
    });
  }));
  document.querySelectorAll(".btn-plano").forEach(button => button.addEventListener("click", event => {
    event.preventDefault();
    if (!getUsuario()) { alert("Você precisa fazer login para assinar um plano."); location.href = "login.html"; }
    else alert("Plano selecionado! A etapa de pagamento ainda não está disponível.");
  }));
  document.getElementById("btnBusca")?.addEventListener("click", () => {
    const termo = prompt("O que você deseja pesquisar?");
    if (termo?.trim()) location.href = `livros.html?busca=${encodeURIComponent(termo.trim())}`;
  });
  const btnMenu = document.getElementById("btnMenu");
  const nav = document.querySelector("nav");
  btnMenu?.addEventListener("click", () => nav?.classList.toggle("menu-aberto"));
  document.querySelectorAll(".btn-ver-mais").forEach(button => button.addEventListener("click", () => {
    alert(`Você selecionou:\n\n${button.dataset.livro || "Livro"}\n\nConfira a loja para ver os livros disponíveis.`);
  }));
  const grid = document.getElementById("gridResenhas");
  const modal = document.getElementById("modalResenha");
  const form = document.getElementById("formResenha");
  const desenharResenha = r => {
    const livro = r.livro?.titulo || r.tituloLivro || "Livro";
    const autor = r.usuario?.nome || "Leitor(a)";
    const nota = Math.max(0, Math.min(5, Number(r.nota) || 0));
    const card = document.createElement("article");
    card.className = "card-resenha";
    card.innerHTML = `<div class="resenha-topo-card"><span class="livro-avaliado">📖 ${escapeHTML(livro)}</span><div class="estrelas">${"★".repeat(nota)}${"☆".repeat(5-nota)}</div></div><h3>"${escapeHTML(r.titulo)}"</h3><p class="texto-resenha">${escapeHTML(r.texto)}</p><div class="resenha-autor"><div class="avatar-autor">${escapeHTML(autor.slice(0,2).toUpperCase())}</div><div><strong>${escapeHTML(autor)}</strong><small>${r.data ? new Date(r.data).toLocaleDateString("pt-BR") : "Agora mesmo"}</small></div></div>`;
    return card;
  };
  const carregarResenhas = async () => {
    if (!grid) return;
    try {
      const dados = await api("/resenhas/listar");
      grid.replaceChildren();
      if (!Array.isArray(dados) || !dados.length) {
        grid.innerHTML = "<p class='texto-resenha'>Ainda não há resenhas. Seja a primeira pessoa a publicar!</p>";
        return;
      }
      dados.forEach(r => grid.appendChild(desenharResenha(r)));
    } catch (error) {
      console.error("Erro ao carregar resenhas:", error);
      grid.innerHTML = "<p class='texto-resenha'>Não foi possível carregar as resenhas. Confira se o backend e o banco estão funcionando.</p>";
    }
  };
  if (grid) carregarResenhas();
  const abrirModal = document.getElementById("btnAbrirModal");
  abrirModal?.addEventListener("click", () => {
    if (!getUsuario()?.id) { alert("Faça login para publicar uma resenha."); location.href = "login.html"; return; }
    modal?.classList.add("ativo");
  });
  document.getElementById("btnFecharModal")?.addEventListener("click", () => modal?.classList.remove("ativo"));
  modal?.addEventListener("click", event => { if (event.target === modal) modal.classList.remove("ativo"); });
  if (form) form.addEventListener("submit", async event => {
    event.preventDefault();
    const user = getUsuario();
    if (!user?.id) { alert("Faça login para publicar uma resenha."); location.href = "login.html"; return; }
    const tituloLivro = document.getElementById("tituloLivro")?.value.trim();
    const titulo = document.getElementById("tituloResenha")?.value.trim();
    const texto = document.getElementById("corpoResenha")?.value.trim();
    const nota = Number(document.getElementById("notaLivro")?.value);
    if (!tituloLivro || !titulo || !texto || !Number.isInteger(nota)) return alert("Preencha todos os campos da resenha.");
    const button = form.querySelector('[type="submit"]');
    if (button) button.disabled = true;
    try {
      await api("/resenhas/cadastrar", { method: "POST", body: JSON.stringify({ tituloLivro, titulo, texto, nota, usuarioId: user.id }) });
      await carregarResenhas();
      modal?.classList.remove("ativo");
      form.reset();
      alert("Resenha publicada e salva no banco de dados!");
    } catch (error) { alert(error.message || "Erro ao publicar resenha."); }
    finally { if (button) button.disabled = false; }
  });
  document.querySelectorAll(".newsletter-input-area, form#newsletterForm").forEach(container => {
    const input = container.querySelector('input[type="email"]');
    const button = container.querySelector('button');
    button?.addEventListener("click", event => {
      event.preventDefault();
      if (!input?.value.trim() || !input.value.includes("@")) return alert("Digite um e-mail válido.");
      alert("Obrigada por se inscrever na newsletter!");
      input.value = "";
    });
  });
  document.querySelectorAll("button, .btn").forEach(button => button.addEventListener("click", () => {
    button.classList.add("clicado");
    setTimeout(() => button.classList.remove("clicado"), 150);
  }));
  document.querySelectorAll("header .header-itens").forEach(items => {
    if (!items.querySelector('a[href="carrinho.html"]')) {
      const cart = document.createElement("a");
      cart.href = "carrinho.html"; cart.className = "header-icon"; cart.setAttribute("aria-label", "Carrinho"); cart.title = "Carrinho"; cart.textContent = "🛒";
      items.prepend(cart);
    }
    items.querySelectorAll('img[alt="Buscar"], img[alt=""]').forEach(icon => {
      if (icon.closest("a")) return;
      if (icon.getAttribute("src")?.includes("lupa")) {
        icon.style.cursor = "pointer"; icon.setAttribute("aria-label", "Pesquisar");
        icon.addEventListener("click", () => { const term = prompt("O que você deseja pesquisar?"); if (term?.trim()) location.href = `loja.html?busca=${encodeURIComponent(term.trim())}`; });
      }
    });
  });
  document.querySelectorAll("header nav a, .header-clube nav a").forEach(link => {
    const target = (link.getAttribute("href") || "").split("?")[0];
    if (target && path.endsWith("/" + target)) link.classList.add("ativo");
  });
  document.querySelectorAll(".produto-card").forEach(card => {
    const nome = card.querySelector("h3")?.textContent.trim() || "Produto";
    const preco = card.querySelector(".preco")?.textContent.trim() || "";
    const imagem = card.querySelector(".produto-img img")?.getAttribute("src") || "";
    const produto = { nome, preco, imagem };
    const read = key => { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; } };
    const favButton = card.querySelector(".btn-favorito");
    const favoritos = read("lontrinosFavoritos");
    if (favoritos.some(item => item.nome === nome)) { favButton?.classList.add("favoritado"); if (favButton) favButton.textContent = "♥"; }
    favButton?.addEventListener("click", () => {
      const items = read("lontrinosFavoritos");
      const index = items.findIndex(item => item.nome === nome);
      if (index >= 0) { items.splice(index, 1); favButton.textContent = "♡"; favButton.classList.remove("favoritado"); }
      else { items.push(produto); favButton.textContent = "♥"; favButton.classList.add("favoritado"); }
      localStorage.setItem("lontrinosFavoritos", JSON.stringify(items));
    });
    card.querySelector(".btn-carrinho")?.addEventListener("click", () => {
      const items = read("lontrinosCarrinho");
      if (!items.some(item => item.nome === nome)) items.push(produto);
      localStorage.setItem("lontrinosCarrinho", JSON.stringify(items));
      alert("Produto adicionado ao carrinho!");
    });
  });
  const buscaProdutos = document.getElementById("buscaProdutos");
  const params = new URLSearchParams(location.search);
  if (buscaProdutos && params.get("busca")) buscaProdutos.value = params.get("busca");
  const filtrarProdutos = () => {
    if (!buscaProdutos) return;
    const termo = buscaProdutos.value.trim().toLocaleLowerCase("pt-BR");
    let quantidade = 0;
    document.querySelectorAll(".produto-card").forEach(card => {
      const visivel = card.textContent.toLocaleLowerCase("pt-BR").includes(termo);
      card.hidden = !visivel;
      if (visivel) quantidade++;
    });
    const contador = document.querySelector(".qtd-produtos");
    if (contador) contador.textContent = `${quantidade} produto${quantidade === 1 ? "" : "s"}`;
  };
  buscaProdutos?.addEventListener("input", filtrarProdutos);
  if (buscaProdutos) filtrarProdutos();

});
