// Defina aqui a URL base do seu servidor backend (Node.js / Express)
const API_URL = "http://localhost:3000";

// --- Funções Auxiliares ---
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
const lerListaLocal = (chave) => { try { const valor = JSON.parse(localStorage.getItem(chave) || "[]"); return Array.isArray(valor) ? valor : []; } catch { return []; } };

// --- Carregamento de Livros via Open Library API (Alternativa mais estável) ---
async function carregarLivrosFrontend() {
  const grade = document.getElementById("gradeLivros");
  if (!grade) return;
  
  try {
    grade.innerHTML = "<p class='estado-carregamento'>Carregando livros da estante...</p>";
    
    // Requisição para a API pública da Open Library (buscando clássicos / ficção)
    const response = await fetch("https://openlibrary.org/subjects/fiction.json?limit=12");
    const data = await response.json();
    
    const livros = data.works || [];
    grade.replaceChildren();
    
    if (!livros.length) { 
      grade.innerHTML = "<p class='estado-carregamento'>Nenhum livro encontrado.</p>"; 
      return; 
    }
    
    livros.forEach(item => {
      const titulo = item.title || "Título não disponível";
      const autor = item.authors && item.authors.length > 0 ? item.authors[0].name : "Autor desconhecido";
      
      // Monta a URL da capa usando o ID da capa da Open Library se disponível
      let capa = "assets/logoLontrino.png";
      if (item.cover_id) {
        capa = `https://covers.openlibrary.org/b/id/${item.cover_id}-M.jpg`;
      }
      
      const card = document.createElement("article"); 
      card.className = "livro-card";
      card.dataset.busca = `${titulo} ${autor}`.toLowerCase();
      
      const img = document.createElement("img"); 
      img.src = capa; 
      img.alt = `Capa de ${titulo}`; 
      img.onerror = () => { img.onerror = null; img.src = "assets/logoLontrino.png"; };
      
      const tituloElemento = document.createElement("h2"); 
      tituloElemento.textContent = titulo;
      
      const autorElemento = document.createElement("p"); 
      autorElemento.className = "livro-autor"; 
      autorElemento.textContent = autor;
      
      card.append(img, tituloElemento, autorElemento);
      
      // Ao clicar no livro, abre o modal com a sinopse / detalhes
      card.addEventListener("click", () => { 
        const elTitulo = document.getElementById("tituloSinopse");
        const elTexto = document.getElementById("textoSinopse");
        const elModal = document.getElementById("modalSinopseFundo");
        
        if (elTitulo) elTitulo.textContent = titulo; 
        if (elTexto) elTexto.textContent = `Livro escrito por ${autor}. Disponível no catálogo literário do Lontrinos.`; 
        if (elModal) elModal.hidden = false; 
      });
      
      grade.appendChild(card);
    });
    
    const busca = document.getElementById("buscaLivros");
    if (busca) { 
      busca.value = new URLSearchParams(location.search).get("busca") || busca.value; 
      filtrarLivros(busca.value); 
    }
  } catch (error) { 
    console.error("Erro ao carregar livros:", error); 
    grade.innerHTML = `<p class='estado-carregamento erro-api'>Erro ao carregar livros da API externa.</p>`; 
  }
}

function filtrarLivros(termo = "") {
  const grade = document.getElementById("gradeLivros"); 
  if (!grade) return;
  const q = termo.toLocaleLowerCase("pt-BR");
  grade.querySelectorAll(".livro-card").forEach(card => card.hidden = !card.dataset.busca.includes(q));
}

// --- Carregamento de Produtos ---
async function carregarProdutosFrontend() {
  const grade = document.getElementById("gridProdutos"); 
  if (!grade) return;
  try {
    const produtos = await api("/produtos/listar");
    if (!Array.isArray(produtos)) throw new Error("A API não retornou uma lista de produtos.");
    grade.replaceChildren();
    
    if (!produtos.length) { 
      grade.innerHTML = "<p class='estado-carregamento'>Nenhum produto cadastrado no banco de dados.</p>"; 
      atualizarContadorProdutos(); 
      return; 
    }
    
    produtos.forEach(produto => {
      const card = document.createElement("article"); 
      card.className = "produto-card"; 
      card.dataset.cat = produto.categoria || ""; 
      card.dataset.nome = produto.nome || "";
      
      const area = document.createElement("div"); 
      area.className = "produto-img";
      const img = document.createElement("img"); 
      img.src = produto.imagem || "assets/logoLontrino.png"; 
      img.alt = produto.nome || "Produto"; 
      img.onerror = () => { img.onerror = null; img.src = "assets/logoLontrino.png"; }; 
      area.appendChild(img);
      
      const info = document.createElement("div"); 
      info.className = "produto-info";
      
      const cat = document.createElement("span"); 
      cat.className = "categoria"; 
      cat.textContent = produto.categoria || "PRODUTO";
      
      const nome = document.createElement("h3"); 
      nome.textContent = produto.nome || "Produto sem nome";
      
      const desc = document.createElement("p"); 
      desc.textContent = produto.descricao || "";
      
      const preco = document.createElement("p"); 
      preco.className = "preco"; 
      preco.textContent = formatarPreco(produto.preco);
      
      const acoes = document.createElement("div"); 
      acoes.className = "produto-acoes";
      
      const carrinho = document.createElement("button"); 
      carrinho.className = "btn-carrinho"; 
      carrinho.textContent = "Adicionar ao carrinho"; 
      carrinho.disabled = Number(produto.estoque) <= 0;
      
      carrinho.addEventListener("click", () => { 
        const items = lerListaLocal("lontrinosCarrinho"); 
        const existente = items.find(i => i.id === produto.id || i.nome === produto.nome); 
        if (existente) existente.quantidade = (existente.quantidade || 1) + 1; 
        else items.push({ id: produto.id, nome: produto.nome, preco: formatarPreco(produto.preco), imagem: produto.imagem, quantidade: 1, tipo: "Carrinho" }); 
        localStorage.setItem("lontrinosCarrinho", JSON.stringify(items)); 
        alert("Produto adicionado ao carrinho!"); 
      });
      
      const favorito = document.createElement("button"); 
      favorito.className = "btn-favorito"; 
      favorito.type = "button"; 
      favorito.textContent = "♡"; 
      favorito.setAttribute("aria-label", "Favoritar produto");
      
      const favoritos = lerListaLocal("lontrinosFavoritos"); 
      if (favoritos.some(i => i.id === produto.id || i.nome === produto.nome)) { 
        favorito.textContent = "♥"; 
        favorito.classList.add("favoritado"); 
      }
      
      favorito.addEventListener("click", () => { 
        const lista = lerListaLocal("lontrinosFavoritos"); 
        const idx = lista.findIndex(i => i.id === produto.id || i.nome === produto.nome); 
        if (idx >= 0) { 
          lista.splice(idx, 1); 
          favorito.textContent = "♡"; 
          favorito.classList.remove("favoritado"); 
        } else { 
          lista.push({ id: produto.id, nome: produto.nome, preco: formatarPreco(produto.preco), imagem: produto.imagem, tipo: "Favorito" }); 
          favorito.textContent = "♥"; 
          favorito.classList.add("favoritado"); 
        } 
        localStorage.setItem("lontrinosFavoritos", JSON.stringify(lista)); 
      });
      
      acoes.append(carrinho, favorito); 
      info.append(cat, nome, desc, preco, acoes); 
      card.append(area, info); 
      grade.appendChild(card);
    });
    
    atualizarContadorProdutos();
    const busca = document.getElementById("buscaProdutos"); 
    if (busca) { 
      busca.value = new URLSearchParams(location.search).get("busca") || busca.value; 
      filtrarProdutosFrontend(busca.value); 
    }
  } catch (error) { 
    console.error(error); 
    grade.innerHTML = `<p class="estado-carregamento erro-api">${escapeHTML(error.message)}. Verifique o backend e o banco.</p>`; 
  }
}

function atualizarContadorProdutos() { 
  const contador = document.querySelector(".qtd-produtos"); 
  const cards = [...document.querySelectorAll("#gridProdutos .produto-card")].filter(c => !c.hidden); 
  if (contador) contador.textContent = `${cards.length} produto${cards.length === 1 ? "" : "s"}`; 
}

function filtrarProdutosFrontend(termo = "") { 
  const q = termo.toLocaleLowerCase("pt-BR"); 
  document.querySelectorAll("#gridProdutos .produto-card").forEach(card => card.hidden = !card.textContent.toLocaleLowerCase("pt-BR").includes(q)); 
  atualizarContadorProdutos(); 
}

// --- Inicialização Principal (DOM carregado) ---
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("gradeLivros")) carregarLivrosFrontend();
  if (document.getElementById("gridProdutos")) carregarProdutosFrontend();
  
  document.getElementById("buscaLivros")?.addEventListener("input", event => filtrarLivros(event.target.value));
  document.getElementById("buscaProdutos")?.addEventListener("input", event => filtrarProdutosFrontend(event.target.value));

  const path = location.pathname.toLowerCase();
  const usuario = getUsuario();
  
  if (path.endsWith("/clube.html") && (!usuario || !usuario.id)) {
    alert("Você precisa fazer login para acessar o Clube.");
    window.location.href = "login.html";
  }
});