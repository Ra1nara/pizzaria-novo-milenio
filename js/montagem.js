/* =====================================================================
   PIZZARIA NOVO MILÊNIO — MONTAGEM DA PIZZA (Etapa 4)
   Interface do configurador: tamanho → sabores → borda → observações → resumo.
   Regras em js/montagem-regras.js; registro em js/selecao.js.
   Preço = maior preço entre os sabores (no tamanho) + borda, se escolhida.
   ===================================================================== */
(function () {
  "use strict";

  var CFG = window.NM_CONFIG, R = window.NM_REGRAS, SEL = window.NM_SELECAO, NM = window.NM;
  var dlg = document.getElementById("montagem");
  if (!CFG || !R || !SEL || !NM || !dlg || typeof dlg.showModal !== "function") return;

  var esc = NM.esc;
  var TIPO = { salgada: "Salgada", doce: "Doce" };
  var LIMITE_RESULTADOS = 8;

  /* ---------- Elementos ---------- */
  var el = {
    radios: Array.prototype.slice.call(dlg.querySelectorAll('input[name="mt-tamanho"]')),
    tiles: Array.prototype.slice.call(dlg.querySelectorAll(".mt-tam")),
    contador: dlg.querySelector(".mt-contador"),
    regra: dlg.querySelector(".mt-regra"),
    escolhidos: dlg.querySelector(".mt-escolhidos"),
    aviso: dlg.querySelector(".mt-aviso"),
    procura: dlg.querySelector(".mt-procura"),
    busca: dlg.querySelector("#mt-busca"),
    limparBusca: dlg.querySelector(".mt-limpar"),
    resultados: dlg.querySelector(".mt-resultados"),
    dica: dlg.querySelector(".mt-dica"),
    obs: dlg.querySelector("#mt-obs"),
    bordas: dlg.querySelector(".mt-bordas"),
    resumo: dlg.querySelector(".mt-resumo-conteudo"),
    preco: dlg.querySelector(".mt-preco strong"),
    precoNota: dlg.querySelector(".mt-preco small"),
    status: dlg.querySelector(".mt-status"),
    adicionar: dlg.querySelector(".mt-adicionar"),
    fechar: Array.prototype.slice.call(dlg.querySelectorAll("[data-mt-fechar]")),
    corpo: dlg.querySelector(".mt-corpo")
  };

  /* ---------- Estado (rascunho preservado ao fechar sem adicionar) ---------- */
  var rascunho = null;   // { origem, tamanho, sabores[], borda, observacao, busca }
  var gatilho = null;    // botão que abriu (para devolver o foco)
  var viaHistorico = false;

  function novoRascunho(numero) {
    return { origem: numero, tamanho: null, sabores: [numero], borda: "", observacao: "", busca: "" };
  }

  /* ---------- Opções de borda (lidas do cardápio; "Sem borda" é o padrão) ---------- */
  var BORDAS = window.NM_CARDAPIO.bordas.itens;
  el.bordas.innerHTML =
    '<label class="mt-borda"><input type="radio" name="mt-borda" value=""><span class="mt-borda-nome">Sem borda</span><span class="mt-borda-preco"></span><span class="mt-borda-check" aria-hidden="true">✓</span></label>' +
    BORDAS.map(function (b) {
      return '<label class="mt-borda"><input type="radio" name="mt-borda" value="' + b.numero + '">' +
        '<span class="mt-borda-nome">' + esc(b.nome) + '</span><span class="mt-borda-preco">+ R$ ' + b.preco + '</span><span class="mt-borda-check" aria-hidden="true">✓</span></label>';
    }).join("");
  el.radiosBorda = Array.prototype.slice.call(el.bordas.querySelectorAll('input[name="mt-borda"]'));

  /* ---------- Abrir / fechar ---------- */
  function abrir(numero, origemBotao) {
    var n = String(numero).padStart(2, "0");
    if (!R.sabor(n)) return;
    if (!rascunho || rascunho.origem !== n) rascunho = novoRascunho(n);
    gatilho = origemBotao || null;

    el.radios.forEach(function (r) { r.checked = r.value === rascunho.tamanho; });
    el.obs.value = rascunho.observacao;
    el.radiosBorda.forEach(function (r) { r.checked = r.value === rascunho.borda; });
    el.busca.value = rascunho.busca;
    render();

    document.documentElement.classList.add("mt-aberto");
    dlg.showModal();
    el.corpo.scrollTop = 0;
    try { history.pushState({ nmMontagem: true }, ""); } catch (e) {}
    var foco = el.radios.filter(function (r) { return r.checked; })[0] || el.radios[0];
    foco.focus();
  }

  function fechar() { if (dlg.open) dlg.close(); }

  dlg.addEventListener("close", function () {
    document.documentElement.classList.remove("mt-aberto");
    if (!viaHistorico && history.state && history.state.nmMontagem) {
      try { history.back(); } catch (e) {}
    }
    viaHistorico = false;
    if (gatilho && document.body.contains(gatilho)) gatilho.focus();
  });
  // Botão "voltar" do celular fecha a montagem sem perder o rascunho
  window.addEventListener("popstate", function () {
    if (dlg.open) { viaHistorico = true; dlg.close(); }
  });
  el.fechar.forEach(function (b) { b.addEventListener("click", fechar); });
  // Clique no fundo escurecido (fora do painel) fecha
  dlg.addEventListener("click", function (e) { if (e.target === dlg) fechar(); });

  /* ---------- Textos ---------- */
  function rotuloTamanho(t) { return CFG.tamanhos[t].rotulo; }
  function nomeSabor(n) { var s = R.sabor(n); return s.numero + " — " + s.nome; }

  function textoMotivo(m, tamanho) {
    if (m.motivo === "repetido") return "Já escolhido";
    if (m.motivo === "limite") return "Limite de " + CFG.tamanhos[tamanho].maxSabores + " sabores atingido";
    if (m.motivo === "tipo") return "Broto: só sabores " + (m.tipoPermitido === "salgada" ? "salgados" : "doces") + " nesta pizza";
    return "Indisponível";
  }

  /* ---------- Render ---------- */
  function render() {
    var t = rascunho.tamanho, nums = rascunho.sabores, max = t ? CFG.tamanhos[t].maxSabores : null;

    // Tamanho: destaque visual + preço da pizza nesse tamanho (maior preço entre os sabores)
    el.tiles.forEach(function (tile) {
      var v = tile.querySelector("input").value;
      tile.classList.toggle("ativo", t === v);
      var p = tile.querySelector(".mt-tam-preco");
      var preco = R.validar(v, nums).valida ? R.precoConhecido(v, nums) : null;
      p.textContent = preco ? "R$ " + preco + (nums.length > 1 ? " com " + nums.length + " sabores" : " com 1 sabor") : "";
    });

    // Borda: destaque da escolhida
    el.bordas.querySelectorAll(".mt-borda").forEach(function (l) {
      l.classList.toggle("ativo", l.querySelector("input").value === rascunho.borda);
    });

    // Contador e regra
    if (!t) {
      el.contador.textContent = "Escolha o tamanho para ver quantos sabores cabem.";
      el.regra.hidden = true;
    } else {
      el.contador.innerHTML = "<strong>" + nums.length + " de " + max + "</strong> " + (max === 1 ? "sabor selecionado" : "sabores selecionados") +
        (nums.length >= max ? " · limite atingido" : "");
      var tipo = R.tipoDaSelecao(nums);
      if (!CFG.tamanhos[t].permiteMisturarSalgadaEDoce) {
        el.regra.hidden = false;
        el.regra.textContent = "Broto: escolha até " + max + " sabores do mesmo tipo." +
          (tipo ? " Como o primeiro sabor é " + (tipo === "salgada" ? "salgado, os doces" : "doce, os salgados") + " ficam indisponíveis." : "");
      } else {
        el.regra.hidden = false;
        el.regra.textContent = "Grande: escolha até " + max + " sabores. Pode misturar salgados e doces.";
      }
    }

    // Sabores escolhidos
    el.escolhidos.innerHTML = nums.map(function (n, i) {
      var s = R.sabor(n);
      return '<li class="mt-escolhido">' +
        '<span class="pizza-n">' + s.numero + "</span>" +
        '<span class="mt-esc-txt"><span class="mt-ordem">Sabor ' + (i + 1) + '</span><span class="mt-esc-nome">' + esc(s.nome) + '</span><span class="mt-tipo mt-tipo-' + s.tipo + '">' + TIPO[s.tipo] + "</span></span>" +
        '<button type="button" class="mt-remover" data-remover="' + s.numero + '" aria-label="Remover sabor ' + s.numero + " — " + esc(s.nome) + '">Remover</button></li>';
    }).join("") || '<li class="mt-vazio">Nenhum sabor escolhido. Procure abaixo.</li>';

    // Avisos de combinação inválida (ex.: trocou para Broto com 3 sabores)
    var v = R.validar(t, nums), avisos = [];
    v.problemas.forEach(function (p) {
      if (p.codigo === "excesso") avisos.push(rotuloTamanho(t) + " aceita até " + p.max + " sabores. Remova " + (p.atual - p.max) + (p.atual - p.max === 1 ? " sabor" : " sabores") + " para continuar.");
      if (p.codigo === "mistura") avisos.push("Broto não mistura salgado e doce. Remova os sabores doces ou os salgados para continuar.");
    });
    el.aviso.hidden = !avisos.length;
    el.aviso.textContent = avisos.join(" ");

    // Procura de sabores
    var semTamanho = !t;
    el.busca.disabled = semTamanho;
    el.procura.classList.toggle("bloqueada", semTamanho);
    el.limparBusca.hidden = !el.busca.value;
    renderResultados();

    // Resumo
    var obs = rascunho.observacao.trim();
    var bordaSel = R.borda(rascunho.borda);
    var montado = t && v.valida ? R.precoMontado(t, nums, rascunho.borda) : null;
    el.resumo.innerHTML =
      '<div class="mt-res-linha"><span>Tamanho</span><strong class="' + (t ? "mt-cor-" + t : "") + '">' + (t ? rotuloTamanho(t) : "A escolher") + "</strong></div>" +
      '<div class="mt-res-linha mt-res-sabores"><span>Sabores</span><ol>' +
        (nums.length ? nums.map(function (n) { return "<li>" + esc(nomeSabor(n)) + "</li>"; }).join("") : "<li>Nenhum</li>") + "</ol></div>" +
      '<div class="mt-res-linha"><span>Borda</span><p>' + (bordaSel ? esc(bordaSel.nome) + " · + R$ " + bordaSel.preco : "Sem borda") + "</p></div>" +
      '<div class="mt-res-linha"><span>Observações</span><p>' + (obs ? esc(obs) : "Nenhuma") + "</p></div>" +
      // Só o resultado do cálculo (regra em NM_REGRAS.precoMontado, sem mudança)
      (montado ? '<div class="mt-res-linha mt-res-preco"><span>Preço</span><p>' +
        "Subtotal: R$ " + montado.base +
        (montado.borda && bordaSel ? "<br>Borda " + esc(bordaSel.nome) + ": + R$ " + montado.borda : "") +
        "<br><strong>Total da pizza: R$ " + montado.total + "</strong></p></div>" : "");

    // Preço: maior preço entre os sabores no tamanho + borda
    if (!t || !montado) { el.preco.textContent = "—"; el.precoNota.textContent = "Preço"; }
    else {
      el.preco.innerHTML = '<span class="rs">R$</span>' + montado.total;
      el.precoNota.textContent = rotuloTamanho(t) + " · " + (nums.length > 1 ? nums.length + " sabores" : "1 sabor") + (montado.borda ? " + borda" : "");
    }
    el.preco.parentNode.classList.remove("a-confirmar");

    // Botão final
    var motivo = !t ? "Escolha o tamanho" : !nums.length ? "Escolha pelo menos 1 sabor" : !v.valida ? "Ajuste os sabores" : "";
    el.adicionar.disabled = !!motivo;
    el.status.textContent = motivo;
  }

  function renderResultados() {
    var t = rascunho.tamanho, q = el.busca.value.trim();
    if (!t) { el.resultados.innerHTML = ""; el.dica.textContent = "Escolha o tamanho primeiro para adicionar mais sabores."; return; }
    if (!q) { el.resultados.innerHTML = ""; el.dica.textContent = "Digite o número, o nome ou um ingrediente. Ex.: 20, frango, chocolate."; return; }

    var r = NM.buscarPizzas(q), lista = r.pizzas;
    if (!lista.length) { el.resultados.innerHTML = ""; el.dica.textContent = "Nenhum sabor encontrado para “" + q + "”."; return; }
    var mostrados = lista.slice(0, LIMITE_RESULTADOS);
    el.dica.textContent = lista.length > LIMITE_RESULTADOS ? "Mostrando " + LIMITE_RESULTADOS + " de " + lista.length + ". Refine a busca para ver outros." : "";

    el.resultados.innerHTML = mostrados.map(function (s) {
      var pode = R.podeAdicionar(t, rascunho.sabores, s.numero);
      var escolhido = rascunho.sabores.indexOf(s.numero) > -1;
      var idMotivo = "mt-mot-" + s.numero;
      var estado = escolhido ? '<span class="mt-op-estado ok" aria-hidden="true">✓ Escolhido</span>' :
                   pode.ok ? '<span class="mt-op-estado add" aria-hidden="true">+ Adicionar</span>' : "";
      return '<li><button type="button" class="mt-opcao' + (escolhido ? " escolhido" : "") + (!pode.ok && !escolhido ? " indisponivel" : "") + '" data-add="' + s.numero + '"' +
        (pode.ok ? "" : ' aria-disabled="true" aria-describedby="' + idMotivo + '"') +
        ' aria-label="' + (escolhido ? "Já escolhido: " : pode.ok ? "Adicionar sabor " : "Indisponível: ") + s.numero + " — " + esc(s.nome) + '">' +
          '<span class="pizza-n">' + s.numero + "</span>" +
          '<span class="mt-op-txt"><span class="mt-op-nome">' + NM.realce(s.nome, r.termos) + ' <span class="mt-tipo mt-tipo-' + s.tipo + '">' + TIPO[s.tipo] + "</span></span>" +
          '<span class="mt-op-desc">' + NM.realce(s.descricao, r.termos) + "</span>" +
          (!pode.ok && !escolhido ? '<span class="mt-op-motivo" id="' + idMotivo + '">' + esc(textoMotivo(pode, t)) + "</span>" : "") +
          "</span>" + estado + "</button></li>";
    }).join("");
  }

  /* ---------- Interações ---------- */
  el.radios.forEach(function (r) {
    r.addEventListener("change", function () { rascunho.tamanho = r.value; render(); });
  });

  el.escolhidos.addEventListener("click", function (e) {
    var b = e.target.closest("[data-remover]");
    if (!b) return;
    var n = b.getAttribute("data-remover"), i = rascunho.sabores.indexOf(n);
    if (i > -1) rascunho.sabores.splice(i, 1);
    render();
    // devolve o foco para algo estável
    var prox = el.escolhidos.querySelector("[data-remover]");
    (prox || (el.busca.disabled ? el.radios[0] : el.busca)).focus();
  });

  el.resultados.addEventListener("click", function (e) {
    var b = e.target.closest("[data-add]");
    if (!b || b.getAttribute("aria-disabled") === "true" || b.classList.contains("escolhido")) return;
    var n = b.getAttribute("data-add");
    if (!R.podeAdicionar(rascunho.tamanho, rascunho.sabores, n).ok) return;
    rascunho.sabores.push(n);
    render();
    var mesmo = el.resultados.querySelector('[data-add="' + n + '"]');
    if (mesmo) mesmo.focus();
  });

  el.busca.addEventListener("input", function () {
    rascunho.busca = el.busca.value;
    el.limparBusca.hidden = !el.busca.value;
    renderResultados();
  });
  el.busca.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && el.busca.value) { e.preventDefault(); e.stopPropagation(); limpar(); }
  });
  function limpar() { el.busca.value = ""; rascunho.busca = ""; el.limparBusca.hidden = true; renderResultados(); el.busca.focus(); }
  el.limparBusca.addEventListener("click", limpar);

  el.obs.addEventListener("input", function () { rascunho.observacao = el.obs.value; render(); });
  el.radiosBorda.forEach(function (r) {
    r.addEventListener("change", function () { rascunho.borda = r.value; render(); });
  });

  el.adicionar.addEventListener("click", function () {
    var t = rascunho.tamanho, nums = rascunho.sabores.slice();
    if (!R.validar(t, nums).valida) return;
    var item = SEL.adicionar({ tamanho: t, sabores: nums, borda: rascunho.borda, observacao: rascunho.observacao });
    if (!item) return;
    var b = R.borda(item.borda);
    rascunho = null;
    fechar();
    // Confirmação com o que foi realmente adicionado (dados do item gravado no carrinho)
    var linhas = [
      rotuloTamanho(item.tamanho) + " · " + item.sabores.map(function (n) { return R.sabor(n).nome; }).join(" + "),
      b ? "Borda: " + b.nome : "Sem borda"
    ];
    if (item.observacao) linhas.push("Obs.: " + item.observacao);
    if (item.quantidade > 1) linhas.push("No carrinho: " + item.quantidade + " iguais a esta");
    if (NM.carrinho && NM.carrinho.confirmar) NM.carrinho.confirmar({ titulo: "Pizza adicionada ao carrinho!", linhas: linhas });
  });

  NM.montagem = { abrir: abrir, fechar: fechar };
})();
