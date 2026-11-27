(() => {
  const API = "http://localhost:3000";
  const lista = document.getElementById("listaCanais");
  const mensagens = document.getElementById("chatMensagens");
  const titulo = document.getElementById("chatTitulo");
  const descricao = document.getElementById("chatDescricao");
  const status = document.getElementById("chatStatus");
  const info = document.getElementById("chatInfo");
  const campo = document.getElementById("inputMensagem");
  const enviar = document.getElementById("btnEnviarMensagem");
  const definirEnvio = ativo => { campo.disabled = !ativo; enviar.disabled = !ativo; };
  const atualizar = document.getElementById("btnChatAtualizar");
  if (!lista || !mensagens) return;

  const token = localStorage.getItem("tokenLontrinos");
  let usuario = null;
  try { usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "null"); } catch {}
  let salaAtual = null;
  let socket = null;
  let salas = [];
  let carregamento = 0;
  definirEnvio(false);
  const generosCatalogo = [
    "Fantasia", "Romance", "Suspense e Mistério", "Terror",
    "Ficção Científica", "Aventura", "Drama", "Clássicos",
    "Romance Histórico", "Distopia", "Poesia", "Contos",
    "Crônicas", "Biografia", "Não Ficção", "Jovem Adulto",
    "Policial", "Humor", "Ficção Contemporânea"
  ];
  const chaveFixados = `lontrinos_canais_fixados_${Number(usuario?.id) || "visitante"}`;
  let fixados = [];
  try {
    const salvos = JSON.parse(localStorage.getItem(chaveFixados) || "[]");
    if (Array.isArray(salvos)) fixados = salvos.map(Number).filter(Number.isInteger).slice(0, 3);
  } catch {}
  const busca = document.getElementById("buscarCanal");
  const avisoFixados = document.getElementById("avisoFixados");
  const normalizar = valor => String(valor || "").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().trim();
  const chaveGenero = sala => normalizar(sala.genero || sala.nome);
  const fixar = id => {
    id = Number(id);
    if (fixados.includes(id)) fixados = fixados.filter(x => x !== id);
    else if (fixados.length < 3) fixados.push(id);
    else {
      avisoFixados.textContent = "Você pode fixar no máximo 3 canais.";
      return;
    }
    localStorage.setItem(chaveFixados, JSON.stringify(fixados));
    avisoFixados.textContent = `${fixados.length}/3 canais fixados`;
    renderizarSalas();
  };
  const criarTituloLista = nome => {
    const li = document.createElement("li");
    li.className = "canal-secao";
    li.textContent = nome;
    lista.append(li);
  };
  function renderizarSalas() {
    lista.replaceChildren();
    const termo = normalizar(busca?.value);
    const publicas = salas.filter(s => s.tipo === "GENERO");
    const clube = salas.filter(s => s.tipo === "CLUBE");
    const ordenar = (a,b) => a.nome.localeCompare(b.nome, "pt-BR");
    const publicasOrdenadas = [...publicas].sort((a,b) =>
      Number(fixados.includes(Number(b.id))) - Number(fixados.includes(Number(a.id))) || ordenar(a,b)
    );
    const mostrar = (sala) => {
      if (termo && !normalizar(`${sala.nome} ${sala.genero || ""}`).includes(termo)) return;
      const li = document.createElement("li");
      li.className = "canal canal-linha";
      li.dataset.id = sala.id;
      if (Number(sala.id) === Number(salaAtual?.id)) li.classList.add("ativo");
      const entrar = document.createElement("button");
      entrar.type = "button";
      entrar.className = "canal-abrir";
      entrar.textContent = `${sala.tipo === "CLUBE" ? "🔒" : "#"} ${sala.nome}`;
      entrar.addEventListener("click", () => abrirSala(sala));
      li.append(entrar);
      if (sala.tipo === "GENERO") {
        const pin = document.createElement("button");
        pin.type = "button";
        pin.className = "canal-fixar" + (fixados.includes(Number(sala.id)) ? " fixado" : "");
        pin.textContent = fixados.includes(Number(sala.id)) ? "📌" : "♧";
        pin.title = fixados.includes(Number(sala.id)) ? "Desafixar canal" : "Fixar canal (máximo 3)";
        pin.setAttribute("aria-label", pin.title);
        pin.addEventListener("click", () => fixar(sala.id));
        li.append(pin);
      }
      lista.append(li);
    };
    const fixadas = publicasOrdenadas.filter(s => fixados.includes(Number(s.id)));
    const outras = publicasOrdenadas.filter(s => !fixados.includes(Number(s.id)));
    if (fixadas.some(s => !termo || normalizar(s.nome).includes(termo))) {
      criarTituloLista("📌 FIXADOS");
      fixadas.forEach(mostrar);
    }
    criarTituloLista("GÊNEROS LITERÁRIOS");
    outras.forEach(mostrar);
    const existentes = new Set(publicas.map(chaveGenero));
    const pendentes = generosCatalogo.filter(g => !existentes.has(normalizar(g)) && (!termo || normalizar(g).includes(termo)));
    pendentes.forEach(nome => {
      const li = document.createElement("li");
      li.className = "canal canal-pendente";
      li.textContent = `# ${nome}`;
      li.title = "Aguardando criação da sala pelo administrador";
      lista.append(li);
    });
    if (clube.length) {
      criarTituloLista("LIVROS DO CLUBE");
      clube.sort(ordenar).forEach(mostrar);
    }
  }
  const ids = new Set();

  const aviso = (texto) => {
    mensagens.replaceChildren();
    const p = document.createElement("p");
    p.className = "chat-aviso";
    p.textContent = texto;
    mensagens.append(p);
  };
  const horario = (data) => {
    const d = new Date(data);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString("pt-BR", {hour:"2-digit", minute:"2-digit"});
  };
  const desenharMensagem = (m) => {
    if (m.id && ids.has(m.id)) return;
    if (m.id) ids.add(m.id);
    if (mensagens.querySelector(".chat-aviso")) mensagens.replaceChildren();
    const minha = Number(m.usuarioId) === Number(usuario?.id);
    const linha = document.createElement("div");
    linha.className = `mensagem${minha ? " eu" : ""}`;
    const conteudo = document.createElement("div");
    const nome = document.createElement("div");
    nome.className = "info";
    const b = document.createElement("b");
    b.textContent = minha ? "Você" : (m.usuario?.apelido || m.usuario?.nome || "Leitor");
    const hora = document.createElement("span");
    hora.textContent = horario(m.data || m.criadaEm || m.createdAt);
    nome.append(b, hora);
    const texto = document.createElement("div");
    texto.className = "texto";
    texto.textContent = m.texto || "";
    conteudo.append(nome, texto);
    if (!minha) {
      const img = document.createElement("img");
      img.src = "assets/user.jpg";
      img.alt = "";
      linha.append(img);
    }
    linha.append(conteudo);
    mensagens.append(linha);
    mensagens.scrollTop = mensagens.scrollHeight;
  };
  const resposta = async (url, autenticado = false) => {
    const headers = autenticado && token ? { Authorization: `Bearer ${token}` } : {};
    const r = await fetch(`${API}${url}`, { headers });
    const dados = await r.json().catch(() => null);
    if (!r.ok) throw new Error(dados?.erro || dados?.message || `Erro ${r.status}`);
    return dados;
  };
  const ack = (evento, dados) => new Promise((resolve, reject) => {
    if (!socket?.connected) return reject(new Error("Sem conexão com o chat"));
    socket.timeout(8000).emit(evento, dados, (erro, retorno) => {
      if (erro) return reject(new Error("O servidor não respondeu"));
      if (!retorno?.sucesso) return reject(new Error(retorno?.erro || "Operação não permitida"));
      resolve(retorno);
    });
  });

  async function abrirSala(sala) {
    const anterior = salaAtual;
    const atual = ++carregamento;
    salaAtual = sala;
    ids.clear();
    titulo.textContent = `# ${sala.nome}`;
    descricao.textContent = sala.tipo === "CLUBE" ? "Sala do livro do clube" : `Conversa sobre ${sala.genero || sala.nome}`;
    info.textContent = sala.tipo === "CLUBE" ? "Esta sala exige assinatura ativa." : "Sala aberta aos leitores cadastrados.";
    campo.placeholder = `Mensagem em #${sala.nome}`;
    lista.querySelectorAll(".canal-linha").forEach(el => el.classList.toggle("ativo", Number(el.dataset.id) === Number(sala.id)));
    definirEnvio(false);
    aviso("Carregando mensagens...");
    try {
      if (anterior && socket?.connected) await ack("sairSala", { salaId: anterior.id });
      await ack("entrarSala", { salaId: sala.id });
      const historico = await resposta(`/api/mensagens/listar?salaId=${encodeURIComponent(sala.id)}`, true);
      if (atual !== carregamento) return;
      mensagens.replaceChildren();
      const itens = Array.isArray(historico) ? historico : (historico?.mensagens || []);
      itens.forEach(desenharMensagem);
      if (!itens.length) aviso("Ainda não há mensagens. Comece a conversa!");
      definirEnvio(true);
    } catch (e) {
      if (atual === carregamento) { aviso(e.message); definirEnvio(false); status.textContent = e.message; }
    }
  }

  async function carregarSalas() {
    try {
      const dados = await resposta("/api/salas/listar");
      salas = Array.isArray(dados) ? dados : [];
      renderizarSalas();
      avisoFixados.textContent = `${fixados.length}/3 canais fixados`;
      if (!salaAtual && socket?.connected && salas.length) await abrirSala(salas[0]);
    } catch (e) {
      lista.replaceChildren();
      const li = document.createElement("li");
      li.className = "canal";
      li.textContent = `Erro ao carregar salas: ${e.message}`;
      lista.append(li);
    }
  }

  async function enviarMensagem() {
    const texto = campo.value.trim();
    if (!texto || !salaAtual) return;
    enviar.disabled = true;
    try {
      await ack("enviarMensagem", { salaId: salaAtual.id, texto });
      campo.value = "";
    } catch (e) { status.textContent = e.message; alert(`Não foi possível enviar: ${e.message}`); }
    finally { enviar.disabled = false; campo.focus(); }
  }

  enviar.addEventListener("click", enviarMensagem);
  campo.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); enviarMensagem(); } });
  atualizar.addEventListener("click", carregarSalas);
  busca?.addEventListener("input", renderizarSalas);
  carregarSalas();
  if (!usuario?.id || !token) {
    status.textContent = "Faça login para conversar";
    aviso("Faça login para participar do chat.");
    campo.disabled = true;
    enviar.disabled = true;
    return;
  }
  if (typeof io !== "function") {
    status.textContent = "Socket.IO indisponível";
    aviso("Não foi possível carregar a conexão com o chat. Confira se o backend está ativo.");
    return;
  }
  socket = io(API, { auth: { token }, reconnection: true });
  socket.on("connect", async () => {
    status.textContent = "Conectado";
    if (salaAtual) {
      const sala = salaAtual;
      salaAtual = null;
      await abrirSala(sala);
    } else if (salas.length) abrirSala(salas[0]);
  });
  socket.on("novaMensagem", m => {
    if (Number(m.salaId) === Number(salaAtual?.id)) desenharMensagem(m);
  });
  socket.on("disconnect", () => { status.textContent = "Reconectando..."; definirEnvio(false); });
  socket.on("connect_error", e => {
    status.textContent = e.message || "Falha de conexão";
    definirEnvio(false);
    aviso("Não foi possível autenticar o chat. Entre novamente na sua conta se a sessão tiver expirado.");
  });
})();
