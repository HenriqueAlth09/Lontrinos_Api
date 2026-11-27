(() => {
  const API = "http://localhost:3000";
  const token = localStorage.getItem("tokenLontrinos");
  let usuario;
  try { usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "null"); } catch {}
  if (!usuario || !token) { location.replace("login.html"); return; }
  const $ = id => document.getElementById(id);
  const limparSessao = () => { localStorage.removeItem("usuarioLogado"); localStorage.removeItem("tokenLontrinos"); };
  const requisicao = async (caminho, opcoes = {}) => {
    const resposta = await fetch(`${API}${caminho}`, { ...opcoes, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(opcoes.headers || {}) } });
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(dados.erro || dados.message || "Não foi possível completar a operação");
    return dados;
  };
  const diasRestantes = (data, dias) => Math.max(0, Math.ceil((new Date(data).getTime() + dias * 86400000 - Date.now()) / 86400000));
  const imagem = u => u.foto || "assets/user.jpg";
  const preencher = u => {
    $("perfil-nome").textContent = u.nome || "Leitor";
    $("perfil-usuario").textContent = u.apelido ? `@${u.apelido}` : "Escolha seu @usuário para conversar";
    $("perfil-email").textContent = u.email || "—";
    $("perfil-livro-favorito").textContent = u.livroFavorito || "Ainda não escolhido";
    $("perfil-lendo").textContent = u.lendoAtualmente || "Ainda não informado";
    $("perfil-bio").textContent = u.bio || "Conte um pouquinho sobre você e suas leituras...";
    let generos = [];
    try { generos = JSON.parse(u.generosFavoritos || "[]"); } catch {}
    $("perfil-generos").textContent = generos.length ? generos.join(" · ") : "Escolha seus favoritos";
    $("perfil-bio-input").value = u.bio || "";
    $("perfil-livro-input").value = u.livroFavorito || "";
    $("perfil-lendo-input").value = u.lendoAtualmente || "";
    Array.from($("perfil-generos-input").options).forEach(op => op.selected = generos.includes(op.value));
    $("perfil-assinante").textContent = u.assinante ? "✦ Assinante Lontrinos" : "✦ Leitor Lontrinos";
    $("perfil-avatar").src = imagem(u);
    $("perfil-avatar-editar").src = imagem(u);
    $("perfil-nome-input").value = u.nome || "";
    $("perfil-apelido").value = u.apelido || "";
    const nomeDias = u.nomeAlteradoEm ? diasRestantes(u.nomeAlteradoEm, 7) : 0;
    const apelidoDias = u.apelidoAlteradoEm ? diasRestantes(u.apelidoAlteradoEm, 30) : 0;
    $("perfil-nome-input").readOnly = nomeDias > 0;
    $("perfil-apelido").readOnly = apelidoDias > 0;
    $("avisoNome").textContent = nomeDias ? `Você poderá mudar seu nome em ${nomeDias} dia(s).` : "Pode ser alterado a cada 7 dias.";
    $("avisoApelido").textContent = apelidoDias ? `Você poderá mudar seu @usuário em ${apelidoDias} dia(s).` : "Obrigatório para usar o chat. Alteração a cada 30 dias.";
    if (!u.apelido) { $("secaoEditar").hidden = false; $("perfil-retorno").textContent = "Escolha um nome de usuário para participar dos chats."; }
  };
  preencher(usuario);
  requisicao("/api/leitores/perfil").then(u => { usuario = u; localStorage.setItem("usuarioLogado", JSON.stringify(u)); preencher(u); }).catch(e => { $("perfil-retorno").textContent = e.message; });
  $("btnEditarPerfil").addEventListener("click", () => { $("secaoEditar").hidden = false; $("secaoEditar").scrollIntoView({ behavior: "smooth" }); });
  $("btnCancelarEdicao").addEventListener("click", () => { $("secaoEditar").hidden = true; $("perfil-retorno").textContent = ""; preencher(usuario); });
  let fotoNova;
  $("perfil-arquivo").addEventListener("change", () => {
    const arquivo = $("perfil-arquivo").files?.[0];
    if (!arquivo) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(arquivo.type) || arquivo.size > 500 * 1024) { $("perfil-retorno").textContent = "Escolha JPG, PNG ou WebP de até 500 KB."; return; }
    const leitor = new FileReader();
    leitor.onload = () => { fotoNova = leitor.result; $("perfil-avatar-editar").src = fotoNova; $("perfil-retorno").textContent = "Foto selecionada. Salve para aplicar."; };
    leitor.readAsDataURL(arquivo);
  });
  $("formPerfil").addEventListener("submit", async e => {
    e.preventDefault();
    const apelido = $("perfil-apelido").value.trim();
    const nome = $("perfil-nome-input").value.trim();
    if (!/^[\p{L}\p{N}_.-]{3,24}$/u.test(apelido)) { $("perfil-retorno").textContent = "O @usuário deve ter de 3 a 24 caracteres, sem espaços."; return; }
    try {
      const generosFavoritos = Array.from($("perfil-generos-input").selectedOptions).map(op => op.value);
      if (generosFavoritos.length > 3) { $("perfil-retorno").textContent = "Selecione no máximo 3 gêneros."; return; }
      const dados = { apelido, nome, bio: $("perfil-bio-input").value, livroFavorito: $("perfil-livro-input").value, lendoAtualmente: $("perfil-lendo-input").value, generosFavoritos };
      if (fotoNova) dados.foto = fotoNova;
      const atualizado = await requisicao("/api/leitores/perfil", { method: "PUT", body: JSON.stringify(dados) });
      usuario = atualizado;
      fotoNova = undefined;
      localStorage.setItem("usuarioLogado", JSON.stringify(atualizado));
      preencher(atualizado);
      $("perfil-retorno").textContent = "Perfil atualizado com sucesso!";
    } catch (erro) { $("perfil-retorno").textContent = erro.message; }
  });
  const sair = () => { if (!confirm("Deseja realmente sair da sua conta Lontrinos?")) return; limparSessao(); location.replace("login.html"); };
  $("btnSairPerfil").addEventListener("click", sair);
  $("btnSair")?.addEventListener("click", sair);
  $("btnExcluirConta").addEventListener("click", async () => {
    if (!confirm("Deseja excluir sua conta permanentemente? Essa ação não pode ser desfeita.")) return;
    const confirmacao = prompt("Para confirmar a exclusão definitiva, digite EXCLUIR:");
    if (confirmacao !== "EXCLUIR") return;
    try { await requisicao("/api/leitores/perfil", { method: "DELETE", body: JSON.stringify({ confirmacao }) }); limparSessao(); location.replace("index.html"); }
    catch (erro) { alert(erro.message); }
  });
})();
