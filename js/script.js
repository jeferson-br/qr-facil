/**
 * QR Fácil — lógica do gerador.
 * Dependência: qrcodejs 1.0.0 (https://github.com/davidshimjs/qrcodejs)
 * Métodos usados: new QRCode(elemento, { text, width, height, colorDark, colorLight, correctLevel })
 *                 e a constante QRCode.CorrectLevel.M. A biblioteca renderiza um <canvas> (e um <img>).
 */
(function () {
  "use strict";

  const MAX_HIST = 8;
  const KEY_HIST = "qrfacil:historico";
  const KEY_PREFS = "qrfacil:prefs";

  // Referências aos elementos
  const $ = (id) => document.getElementById(id);
  const form = $("form"), conteudo = $("conteudo"), erro = $("erro"), contador = $("contador");
  const corCodigo = $("corCodigo"), corFundo = $("corFundo"), tamanho = $("tamanho");
  const qrArea = $("qrArea"), btnBaixar = $("btnBaixar"), btnImprimir = $("btnImprimir");
  const listaHist = $("listaHist"), histVazio = $("histVazio"), toast = $("toast");

  let ultimoTexto = "";

  /* ---------- localStorage com tratamento de erro ---------- */
  function ler(chave, padrao) {
    try { const v = localStorage.getItem(chave); return v ? JSON.parse(v) : padrao; }
    catch (e) { return padrao; }
  }
  function salvar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { /* armazenamento indisponível */ }
  }

  /* ---------- Feedback ---------- */
  let toastTimer;
  function avisar(msg) {
    toast.textContent = msg;
    toast.classList.add("visivel");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visivel"), 2200);
  }
  function mostrarErro(msg) {
    erro.textContent = msg; erro.hidden = false;
    conteudo.setAttribute("aria-invalid", "true");
    conteudo.focus();
  }
  function limparErro() { erro.hidden = true; conteudo.removeAttribute("aria-invalid"); }

  /* ---------- Preferências ---------- */
  function atualizarCores() {
    $("corCodigoTxt").textContent = corCodigo.value;
    $("corFundoTxt").textContent = corFundo.value;
    document.querySelectorAll(".preset").forEach((p) => {
      p.setAttribute("aria-pressed", String(p.dataset.fg === corCodigo.value && p.dataset.bg === corFundo.value));
    });
    salvar(KEY_PREFS, { fg: corCodigo.value, bg: corFundo.value, size: tamanho.value });
  }
  function carregarPrefs() {
    const p = ler(KEY_PREFS, null);
    if (p) {
      if (/^#[0-9a-f]{6}$/i.test(p.fg)) corCodigo.value = p.fg;
      if (/^#[0-9a-f]{6}$/i.test(p.bg)) corFundo.value = p.bg;
      if ([...tamanho.options].some((o) => o.value === p.size)) tamanho.value = p.size;
    }
    atualizarCores();
  }

  /* ---------- Contraste: avisa se as cores forem parecidas ---------- */
  function luminancia(hex) {
    const c = [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contraste(a, b) {
    const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  }

  /* ---------- Geração do QR Code ---------- */
  function gerar(texto, registrar) {
    if (typeof window.QRCode !== "function") {
      mostrarErro("Não foi possível carregar a biblioteca de QR Code. Verifique sua conexão e recarregue a página.");
      return false;
    }
    const size = parseInt(tamanho.value, 10);
    qrArea.innerHTML = "";
    try {
      new QRCode(qrArea, {
        text: texto,
        width: size,
        height: size,
        colorDark: corCodigo.value,
        colorLight: corFundo.value,
        correctLevel: QRCode.CorrectLevel.M,
      });
    } catch (e) {
      // A biblioteca lança erro quando o conteúdo excede a capacidade do QR Code
      qrArea.innerHTML = '<p class="vazio">Seu QR Code aparecerá aqui.</p>';
      mostrarErro("O conteúdo é longo demais para um QR Code. Tente um texto menor.");
      habilitarAcoes(false);
      return false;
    }
    // Mantém só o canvas visível (a lib também cria um <img>)
    const img = qrArea.querySelector("img");
    if (img) img.style.display = "none";
    const canvas = qrArea.querySelector("canvas");
    if (canvas) { canvas.style.display = "block"; canvas.setAttribute("role", "img"); canvas.setAttribute("aria-label", "QR Code de: " + texto); }

    ultimoTexto = texto;
    habilitarAcoes(true);
    if (registrar) adicionarHistorico(texto);
    if (contraste(corCodigo.value, corFundo.value) < 3) avisar("Atenção: cores com pouco contraste podem não ser lidas.");
    return true;
  }

  function habilitarAcoes(on) { btnBaixar.disabled = !on; btnImprimir.disabled = !on; }

  /* ---------- Histórico ---------- */
  function adicionarHistorico(texto) {
    let h = ler(KEY_HIST, []).filter((i) => i.text !== texto);
    h.unshift({ text: texto, fg: corCodigo.value, bg: corFundo.value, size: tamanho.value, at: Date.now() });
    salvar(KEY_HIST, h.slice(0, MAX_HIST));
    renderHistorico();
  }
  function renderHistorico() {
    const h = ler(KEY_HIST, []);
    listaHist.innerHTML = "";
    h.forEach((item) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button"; b.className = "item";
      b.setAttribute("aria-label", "Recarregar QR Code: " + item.text);
      const cor = document.createElement("span");
      cor.className = "item__cor";
      cor.style.background = `linear-gradient(135deg, ${item.fg} 50%, ${item.bg} 50%)`;
      const txt = document.createElement("span");
      txt.className = "item__txt"; txt.textContent = item.text; // textContent evita injeção de HTML
      const data = document.createElement("span");
      data.className = "item__data";
      data.textContent = new Date(item.at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
      b.append(cor, txt, data);
      b.addEventListener("click", () => {
        conteudo.value = item.text; corCodigo.value = item.fg; corFundo.value = item.bg; tamanho.value = item.size;
        atualizarContador(); atualizarCores(); limparErro(); gerar(item.text, false);
      });
      li.appendChild(b); listaHist.appendChild(li);
    });
    histVazio.hidden = h.length > 0;
    $("btnApagarHist").hidden = h.length === 0;
  }

  function atualizarContador() { contador.textContent = `${conteudo.value.length}/1500`; }

  /* ---------- Eventos ---------- */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const texto = conteudo.value.trim();
    if (!texto) { mostrarErro("Digite uma URL ou um texto para gerar o QR Code."); return; }
    limparErro();
    if (gerar(texto, true)) avisar("QR Code gerado!");
  });

  conteudo.addEventListener("input", () => { atualizarContador(); if (conteudo.value.trim()) limparErro(); });
  // Ctrl/Cmd + Enter gera direto do campo
  conteudo.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) form.requestSubmit(); });

  // Alterações de cor/tamanho atualizam o QR existente instantaneamente
  [corCodigo, corFundo, tamanho].forEach((el) => el.addEventListener("input", () => {
    atualizarCores(); if (ultimoTexto) gerar(ultimoTexto, false);
  }));

  document.querySelectorAll(".preset").forEach((p) => p.addEventListener("click", () => {
    corCodigo.value = p.dataset.fg; corFundo.value = p.dataset.bg;
    atualizarCores(); if (ultimoTexto) gerar(ultimoTexto, false);
  }));

  document.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => {
    conteudo.value = c.dataset.exemplo; atualizarContador(); limparErro(); gerar(c.dataset.exemplo, true);
  }));

  $("btnCopiar").addEventListener("click", async () => {
    const texto = conteudo.value.trim();
    if (!texto) { mostrarErro("Não há nada para copiar. Digite um conteúdo primeiro."); return; }
    try {
      await navigator.clipboard.writeText(texto);
      avisar("Texto copiado!");
    } catch (e) {
      // Fallback para navegadores sem Clipboard API (ex.: arquivo aberto localmente)
      conteudo.select();
      const ok = document.execCommand && document.execCommand("copy");
      avisar(ok ? "Texto copiado!" : "Não foi possível copiar. Use Ctrl+C.");
    }
  });

  $("btnLimpar").addEventListener("click", () => {
    conteudo.value = ""; ultimoTexto = ""; atualizarContador(); limparErro();
    qrArea.innerHTML = '<p class="vazio">Seu QR Code aparecerá aqui.</p>';
    habilitarAcoes(false); conteudo.focus();
  });

  btnBaixar.addEventListener("click", () => {
    const canvas = qrArea.querySelector("canvas");
    if (!canvas) { avisar("Gere um QR Code antes de baixar."); return; }
    try {
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `qr-facil-${Date.now()}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      avisar("Download iniciado.");
    } catch (e) { avisar("Não foi possível baixar a imagem."); }
  });

  btnImprimir.addEventListener("click", () => window.print());

  $("btnApagarHist").addEventListener("click", () => {
    if (!confirm("Apagar todo o histórico deste navegador?")) return;
    try { localStorage.removeItem(KEY_HIST); } catch (e) {}
    renderHistorico(); avisar("Histórico apagado.");
  });

  /* ---------- Inicialização ---------- */
  carregarPrefs();
  renderHistorico();
  atualizarContador();
})();
