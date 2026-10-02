/* =====================================================================
   PIZZARIA NOVO MILÊNIO — DADOS DO PEDIDO

   1) NM_PEDIDO: estado dos dados de quem pede + validação (sem interface).
      As pizzas e bebidas NÃO são copiadas: continuam em js/selecao.js.
      Persistência: localStorage, mesma estratégia do carrinho.
   2) Interface: segunda tela do mesmo painel do carrinho
         Carrinho → Dados do pedido
      Voltar (seta, Esc, botão do celular ou "Voltar ao carrinho")
      retorna ao carrinho sem perder nada.

   O botão final chama js/whatsapp.js, que só ABRE o WhatsApp com a
   mensagem preenchida (a pessoa envia lá). Não limpa o carrinho.
   Forma de pagamento: só a preferência informada pela pessoa (Pix, Dinheiro,
   Cartão de débito, Cartão de crédito, Outro). NÃO há pagamento, cobrança,
   Pix automático ou integração: o pagamento é combinado pelo WhatsApp.
   NÃO calcula taxa, área ou tempo de entrega.
   Carregado ANTES de js/carrinho.js (trata o "voltar" primeiro).
   ===================================================================== */
(function (raiz) {
  "use strict";

  /* =================================================================
     1) ESTADO
     ================================================================= */
  var CHAVE = "nm-pedido-v1";
  var LIMITES = { nome: 80, whatsapp: 20, endereco: 120, numero: 10, complemento: 80, referencia: 120, observacoesEntrega: 200 };
  var CAMPOS = ["recebimento", "nome", "whatsapp", "endereco", "numero", "complemento", "referencia", "observacoesEntrega", "formaPagamento"];
  /* Formas de pagamento (preferência informada; não há pagamento pelo site) */
  var PAGAMENTOS = { pix: "Pix", dinheiro: "Dinheiro", debito: "Cartão de débito", credito: "Cartão de crédito", outro: "Outro" };
  var dados = vazio();
  var pronto = false; // true depois de "Continuar" com tudo válido

  function vazio() {
    return { recebimento: "", nome: "", whatsapp: "", endereco: "", numero: "", complemento: "", referencia: "", observacoesEntrega: "", formaPagamento: "" };
  }
  function salvar() {
    try { raiz.localStorage.setItem(CHAVE, JSON.stringify({ dados: dados, pronto: pronto })); } catch (e) {}
  }
  function carregar() {
    try {
      var b = JSON.parse(raiz.localStorage.getItem(CHAVE) || "null");
      if (!b || typeof b.dados !== "object") return;
      CAMPOS.forEach(function (k) {
        if (typeof b.dados[k] === "string") dados[k] = LIMITES[k] ? b.dados[k].slice(0, LIMITES[k]) : b.dados[k];
      });
      if (dados.recebimento !== "delivery" && dados.recebimento !== "retirada") dados.recebimento = "";
      if (!PAGAMENTOS.hasOwnProperty(dados.formaPagamento)) dados.formaPagamento = "";
      pronto = !!b.pronto && validar(dados).valido;
    } catch (e) {}
  }

  /* ---------- WhatsApp: celular brasileiro com DDD ---------- */
  /** Só os dígitos de DDD + número. Aceita +55, espaços, parênteses e hífen. */
  function digitosWhatsapp(texto) {
    var d = String(texto || "").replace(/\D/g, "");
    if (d.length === 13 && d.indexOf("55") === 0) d = d.slice(2);          // +55 11 9xxxx-xxxx
    if (d.length === 12 && d.charAt(0) === "0") d = d.slice(1);            // 0 11 9xxxx-xxxx
    return d;
  }
  /** Celular: DDD (2 dígitos, sem zero inicial) + 9 dígitos começando por 9. */
  function whatsappValido(texto) {
    return /^[1-9][0-9]9[0-9]{8}$/.test(digitosWhatsapp(texto));
  }
  /** Máscara de exibição "(11) 99999-9999" — não altera a regra, só a leitura. */
  function formataWhatsapp(texto) {
    var d = digitosWhatsapp(texto).slice(0, 11);
    if (!d) return "";
    if (d.length <= 2) return "(" + d;
    if (d.length <= 7) return "(" + d.slice(0, 2) + ") " + d.slice(2);
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  }

  /**
   * Validação.
   * Obrigatórios: nome, WhatsApp, forma de recebimento e forma de pagamento.
   * Endereço e número: obrigatórios no Delivery. Na Retirada o local é a pizzaria.
   */
  function validar(d) {
    d = d || dados;
    var e = {};
    if (d.recebimento !== "delivery" && d.recebimento !== "retirada") e.recebimento = "Escolha como você vai receber o pedido.";
    if (!String(d.nome).trim()) e.nome = "Informe seu nome.";
    if (!whatsappValido(d.whatsapp)) e.whatsapp = "Informe um WhatsApp válido.";
    if (d.recebimento === "delivery") {
      if (!String(d.endereco).trim()) e.endereco = "Informe o endereço.";
      if (!String(d.numero).trim()) e.numero = "Informe o número.";
    }
    if (!PAGAMENTOS.hasOwnProperty(d.formaPagamento)) e.formaPagamento = "Escolha uma forma de pagamento.";
    return { valido: Object.keys(e).length === 0, erros: e };
  }

  function limpa(t) { return String(t || "").replace(/\s+/g, " ").trim(); }

  raiz.NM_PEDIDO = {
    LIMITES: LIMITES,
    PAGAMENTOS: PAGAMENTOS,
    dados: function () { return Object.assign({}, dados); },
    atualizar: function (parcial) {
      Object.keys(parcial || {}).forEach(function (k) {
        if (CAMPOS.indexOf(k) < 0) return;
        var v = String(parcial[k] == null ? "" : parcial[k]);
        dados[k] = LIMITES[k] ? v.slice(0, LIMITES[k]) : v;
      });
      pronto = false; // qualquer alteração exige novo "Continuar"
      salvar();
    },
    validar: validar,
    whatsappValido: whatsappValido,
    formataWhatsapp: formataWhatsapp,
    /** "Continuar": valida e marca o pedido como pronto. Não envia nada. */
    confirmar: function () {
      var v = validar();
      if (!v.valido) return v;
      pronto = true;
      salvar();
      return v;
    },
    estaPronto: function () { return pronto && validar().valido; },
    /**
     * Pedido completo para a Etapa 7 (montagem da mensagem):
     * { carrinho: { itens, resumo }, comprador: {...}, pagamento, pronto }
     * Na Retirada, os campos de entrega (endereço, número, complemento,
     * referência e observações da entrega) saem vazios; os digitados ficam
     * guardados caso a pessoa volte para Delivery.
     */
    obter: function () {
      var retirada = dados.recebimento === "retirada";
      var e = raiz.NM_CONFIG ? raiz.NM_CONFIG.empresa.endereco : null;
      return {
        carrinho: raiz.NM_SELECAO ? raiz.NM_SELECAO.pedido() : { itens: [], resumo: null },
        comprador: {
          nome: limpa(dados.nome),
          whatsapp: formataWhatsapp(dados.whatsapp),
          recebimento: dados.recebimento,
          endereco: retirada ? "" : limpa(dados.endereco),
          numero: retirada ? "" : limpa(dados.numero),
          complemento: retirada ? "" : limpa(dados.complemento),
          referencia: retirada ? "" : limpa(dados.referencia),
          observacoesEntrega: retirada ? "" : String(dados.observacoesEntrega || "").trim()
        },
        localRetirada: retirada && e ? e.linha1 + " – " + e.bairro + ", " + e.cidade + " – " + e.cep : null,
        // Preferência de pagamento informada pela pessoa (sem pagamento pelo site)
        pagamento: { forma: PAGAMENTOS[dados.formaPagamento] ? dados.formaPagamento : "", rotulo: PAGAMENTOS[dados.formaPagamento] || "" },
        pronto: pronto && validar().valido
      };
    },
    limpar: function () { dados = vazio(); pronto = false; salvar(); }
  };

  carregar();

  /* =================================================================
     2) INTERFACE (somente no navegador)
     ================================================================= */
  if (!raiz.document) return;
  var doc = raiz.document;
  var CFG = raiz.NM_CONFIG, SEL = raiz.NM_SELECAO, PED = raiz.NM_PEDIDO;
  var dlg = doc.getElementById("carrinho");
  var form = doc.getElementById("pd-form");
  if (!CFG || !SEL || !dlg || !form) return;

  var titulo = dlg.querySelector("#cr-titulo");
  var tituloCarrinho = "";
  var corpo = dlg.querySelector('.pd-corpo');
  var caixaErros = form.querySelector(".pd-erros");
  var caixaOk = dlg.querySelector(".pd-pronto");
  var resumoEl = dlg.querySelector(".pd-resumo-conteudo");
  var resumoLinha = dlg.querySelector(".pd-resumo-linha");
  var totalEl = dlg.querySelector(".pd-total");
  var TIPO = { salgada: "Salgada", doce: "Doce" };
  var naTelaDeDados = false, ignorarPop = 0, tentou = false;

  function esc(s) { return raiz.NM && raiz.NM.esc ? raiz.NM.esc(s) : String(s); }
  function plural(n, s, p) { return n + " " + (n === 1 ? s : p); }
  function campo(n) { return form.elements[n]; }

  /* ---------- Navegação Carrinho ⇄ Dados ---------- */
  function irParaDados() {
    if (!SEL.totalItens()) return;
    tituloCarrinho = titulo.textContent;
    preencher();
    renderResumo();
    tentou = false;
    mostrarErros({}, false);
    caixaOk.hidden = true;
    naTelaDeDados = true;
    dlg.setAttribute("data-view", "dados");
    titulo.textContent = "Dados do pedido";
    try { history.pushState({ nmPedido: "dados" }, ""); } catch (e) {}
    corpo.scrollTop = 0;
    titulo.focus();
  }
  function mostrarCarrinho() {
    naTelaDeDados = false;
    dlg.setAttribute("data-view", "carrinho");
    doc.dispatchEvent(new CustomEvent("nm:carrinho", { detail: { tipo: "redesenhar" } })); // carrinho.js redesenha e atualiza o título
    if (titulo.textContent === "Dados do pedido") titulo.textContent = tituloCarrinho || "Seu carrinho";
    titulo.focus();
  }
  function voltarAoCarrinho() {
    if (!naTelaDeDados) return;
    if (history.state && history.state.nmPedido) { ignorarPop += 1; try { history.back(); } catch (e) { ignorarPop -= 1; } }
    mostrarCarrinho();
  }

  // Botão "voltar" do celular/navegador: Dados → Carrinho (sem fechar o painel)
  raiz.addEventListener("popstate", function (e) {
    if (ignorarPop > 0) { ignorarPop -= 1; e.stopImmediatePropagation(); return; }
    if (dlg.open && naTelaDeDados) { e.stopImmediatePropagation(); mostrarCarrinho(); }
  });
  // Seta / X do cabeçalho na tela de dados: volta ao carrinho
  dlg.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cr-fechar]");
    if (b && naTelaDeDados && b.closest(".mt-topo")) { e.stopPropagation(); e.preventDefault(); voltarAoCarrinho(); }
  }, true);
  // Esc na tela de dados: volta ao carrinho
  dlg.addEventListener("cancel", function (e) { if (naTelaDeDados) { e.preventDefault(); voltarAoCarrinho(); } });
  // Painel fechado estando nos dados (ex.: clique fora): limpa o histórico extra
  dlg.addEventListener("close", function () {
    if (naTelaDeDados) {
      naTelaDeDados = false;
      if (history.state && history.state.nmPedido) { ignorarPop += 1; try { history.go(-2); } catch (e) { ignorarPop -= 1; } }
    }
    dlg.setAttribute("data-view", "carrinho");
  });
  dlg.querySelector("[data-pd-voltar]").addEventListener("click", voltarAoCarrinho);

  // Entrada: botão "Avançar" do carrinho
  doc.addEventListener("nm:avancar-pedido", function (e) {
    if (e.detail) e.detail.tratado = true;
    irParaDados();
  });

  /* ---------- Formulário ---------- */
  function preencher() {
    var d = PED.dados();
    ["nome", "endereco", "numero", "complemento", "referencia", "observacoesEntrega"].forEach(function (k) { campo(k).value = d[k]; });
    campo("whatsapp").value = PED.formataWhatsapp(d.whatsapp);
    Array.prototype.forEach.call(form.querySelectorAll('input[name="recebimento"]'), function (r) { r.checked = r.value === d.recebimento; });
    Array.prototype.forEach.call(form.querySelectorAll('input[name="formaPagamento"]'), function (r) { r.checked = r.value === d.formaPagamento; });
    aplicarRecebimento(d.recebimento);
    contador();
  }
  function aplicarRecebimento(tipo) {
    var delivery = tipo === "delivery", retirada = tipo === "retirada";
    form.querySelector(".pd-entrega").hidden = !delivery;
    form.querySelector(".pd-retirada").hidden = !retirada;
    campo("endereco").required = delivery;
    campo("numero").required = delivery;
    form.querySelector(".pd-escolha").hidden = delivery || retirada;
    var nota = dlg.querySelector(".pd-nota");
    if (nota) nota.hidden = retirada; // taxa de entrega só faz sentido no Delivery
    Array.prototype.forEach.call(form.querySelectorAll(".pd-op"), function (l) {
      l.classList.toggle("ativo", l.querySelector("input").value === tipo);
    });
  }
  function contador() {
    var c = form.querySelector(".pd-contador"), n = campo("observacoesEntrega").value.length;
    if (c) c.textContent = n + " de " + LIMITES.observacoesEntrega + " caracteres";
  }

  form.addEventListener("input", function (e) {
    var t = e.target;
    if (!t.name) return;
    if (t.name === "whatsapp") {
      // máscara mantendo o cursor no fim (digitação comum no celular)
      var f = PED.formataWhatsapp(t.value);
      if (f !== t.value) t.value = f;
    }
    var p = {}; p[t.name] = t.value;
    PED.atualizar(p);
    if (t.name === "recebimento") aplicarRecebimento(t.value);
    if (t.name === "observacoesEntrega") contador();
    caixaOk.hidden = true;
    if (tentou) mostrarErros(PED.validar().erros, false);
  });
  form.addEventListener("change", function (e) {
    if (e.target.name !== "recebimento") return;
    PED.atualizar({ recebimento: e.target.value });
    aplicarRecebimento(e.target.value);
    caixaOk.hidden = true;
    if (tentou) mostrarErros(PED.validar().erros, false);
  });
  // Ao sair de um campo obrigatório já preenchido de forma inválida, avisa ali mesmo
  form.addEventListener("focusout", function (e) {
    var n = e.target.name;
    if (["nome", "whatsapp", "endereco", "numero"].indexOf(n) < 0) return;
    if (!tentou && !e.target.value.trim()) return;
    erroCampo(n, PED.validar().erros[n] || "");
  });
  // Teclado do celular: mantém o campo ativo visível
  form.addEventListener("focusin", function (e) {
    var t = e.target;
    if (!/^(INPUT|TEXTAREA)$/.test(t.tagName) || t.type === "radio") return;
    setTimeout(function () { try { t.scrollIntoView({ block: "center" }); } catch (x) {} }, 300);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    tentou = true;
    var v = PED.confirmar();
    if (!v.valido) { caixaOk.hidden = true; mostrarErros(v.erros, true); return; }
    if (!SEL.totalItens()) { caixaOk.hidden = true; mostrarErros({}, false); voltarAoCarrinho(); return; }
    mostrarErros({}, false);
    doc.dispatchEvent(new CustomEvent("nm:pedido-pronto", { detail: PED.obter() }));
    // Etapa 7: abre o WhatsApp oficial da pizzaria com a mensagem preenchida.
    // Não limpa o carrinho: a pessoa ainda pode voltar antes de enviar.
    var envio = raiz.NM_WHATSAPP ? raiz.NM_WHATSAPP.enviar() : { ok: false };
    if (envio.ok) {
      var lk = caixaOk.querySelector(".pd-link-zap");
      if (lk) lk.href = envio.url;
    }
    caixaOk.hidden = !envio.ok;
    if (envio.ok) caixaOk.focus();
  });

  /* ---------- Erros: texto + aria-invalid + resumo navegável ---------- */
  var ORDEM = ["recebimento", "nome", "whatsapp", "endereco", "numero", "formaPagamento"];
  var GRUPOS = { recebimento: ".pd-recebimento", formaPagamento: ".pd-pagamento" }; // campos de opção (radio)
  var PRIMEIRO = { recebimento: "pd-rec-delivery", formaPagamento: "pd-pag-pix" };
  function erroCampo(nome, msg) {
    var p = form.querySelector("#pd-erro-" + nome);
    if (!p) return;
    p.textContent = msg ? "⚠ " + msg : "";
    p.hidden = !msg;
    if (GRUPOS[nome]) {
      form.querySelector(GRUPOS[nome]).classList.toggle("com-erro", !!msg);
      Array.prototype.forEach.call(form.querySelectorAll('input[name="' + nome + '"]'), function (r) { r.setAttribute("aria-invalid", msg ? "true" : "false"); });
    } else {
      campo(nome).setAttribute("aria-invalid", msg ? "true" : "false");
      campo(nome).closest(".pd-campo").classList.toggle("com-erro", !!msg);
    }
  }
  function mostrarErros(erros, focar) {
    ORDEM.forEach(function (k) { erroCampo(k, erros[k] || ""); });
    var lista = ORDEM.filter(function (k) { return erros[k]; });
    caixaErros.hidden = !lista.length;
    caixaErros.innerHTML = lista.length
      ? "<strong>Confira " + plural(lista.length, "campo", "campos") + ":</strong><ul>" + lista.map(function (k) {
          return '<li><a href="#' + (PRIMEIRO[k] || "pd-" + k) + '">' + esc(erros[k]) + "</a></li>";
        }).join("") + "</ul>"
      : "";
    if (focar && lista.length) caixaErros.focus();
  }
  caixaErros.addEventListener("click", function (e) {
    var a = e.target.closest("a"); if (!a) return;
    e.preventDefault();
    var alvo = form.querySelector(a.getAttribute("href"));
    if (alvo) alvo.focus();
  });

  /* ---------- Resumo compacto (valores vindos do estado do carrinho) ---------- */
  function renderResumo() {
    var itens = SEL.listarDetalhado(), r = SEL.resumo(), pc = r.porCategoria;
    var pizzas = itens.filter(function (i) { return i.categoria === "pizza"; });
    var bebidas = itens.filter(function (i) { return i.categoria === "bebida"; });
    var h = "";
    if (pizzas.length) {
      h += '<p class="pd-grupo">Pizzas</p><ul class="pd-itens">' + pizzas.map(function (i) {
        return '<li class="pd-item"><div class="pd-item-cab"><span class="cr-tam cr-tam-' + i.tamanho + '">Pizza ' + CFG.tamanhos[i.tamanho].rotulo + "</span>" +
          '<span class="pd-item-valor">' + (i.precoLinha ? "R$ " + i.precoLinha : "Preço a confirmar") + "</span></div>" +
          '<ul class="pd-sabores">' + i.sabores.map(function (s) { return "<li>" + s.numero + " — " + esc(s.nome) + "</li>"; }).join("") + "</ul>" +
          '<p class="pd-det">Borda: ' + (i.borda ? esc(i.borda.nome) : "sem borda") + " · Qtd.: " + i.quantidade +
            (i.quantidade > 1 && i.precoUnitario ? " × R$ " + i.precoUnitario : "") + "</p>" +
          (i.observacao ? '<p class="pd-det">Obs.: ' + esc(i.observacao) + "</p>" : "") + "</li>";
      }).join("") + "</ul>";
    }
    if (bebidas.length) {
      h += '<p class="pd-grupo">Bebidas</p><ul class="pd-itens">' + bebidas.map(function (i) {
        return '<li class="pd-item"><div class="pd-item-cab"><span class="pd-bebida">' + esc(i.nome) + " × " + i.quantidade + "</span>" +
          '<span class="pd-item-valor">R$ ' + i.precoLinha + "</span></div></li>";
      }).join("") + "</ul>";
    }
    h += '<div class="mt-resumo-conteudo pd-financeiro">' +
      (pc.pizzas.quantidade ? '<div class="mt-res-linha"><span>Subtotal das pizzas</span><strong><span class="rs">R$</span>' + pc.pizzas.subtotalConhecido + "</strong></div>" : "") +
      (pc.bebidas.quantidade ? '<div class="mt-res-linha"><span>Bebidas</span><strong><span class="rs">R$</span>' + pc.bebidas.subtotalConhecido + "</strong></div>" : "") +
      (r.totalDefinido
        ? '<div class="mt-res-linha cr-res-total"><span>Total do pedido</span><strong><span class="rs">R$</span>' + r.subtotalConhecido + "</strong></div>"
        : '<div class="mt-res-linha cr-res-total"><span>Total do pedido</span><strong class="cr-a-confirmar">A confirmar</strong></div>') +
      '<p class="pd-nota"' + (PED.dados().recebimento === "retirada" ? " hidden" : "") + '>O total não inclui taxa de entrega.</p>' +
      "</div>";
    resumoEl.innerHTML = h;
    var totalTxt = r.totalDefinido ? "R$ " + r.subtotalConhecido : "a confirmar";
    resumoLinha.textContent = plural(r.totalItens, "item", "itens") + " · " + totalTxt;
    totalEl.innerHTML = r.totalDefinido
      ? '<small>Total do pedido · ' + plural(r.totalItens, "item", "itens") + '</small><strong><span class="rs">R$</span>' + r.subtotalConhecido + "</strong>"
      : '<small>Total do pedido</small><strong class="cr-a-confirmar">A confirmar</strong>';
  }

  // Se o carrinho mudar com a tela de dados aberta (não deveria), mantém o resumo coerente
  doc.addEventListener("nm:carrinho", function () { if (naTelaDeDados) renderResumo(); });

  // Retirada: endereço oficial vindo da configuração
  var e = CFG.empresa.endereco;
  form.querySelector(".pd-local-retirada").innerHTML = "<strong>" + esc(e.linha1) + "</strong>" + esc(e.bairro) + ", " + esc(e.cidade) + "<br>" + esc(e.cep);
  form.querySelector(".pd-horario").textContent = CFG.horario.exibicao;

  // No desktop o resumo fica aberto ao lado do formulário; no celular começa recolhido
  var detalhes = dlg.querySelector(".pd-resumo");
  var largo = raiz.matchMedia ? raiz.matchMedia("(min-width: 1024px)") : null;
  function ajustaResumo() { if (largo && largo.matches) detalhes.open = true; }
  if (largo) { ajustaResumo(); (largo.addEventListener ? largo.addEventListener("change", ajustaResumo) : largo.addListener(ajustaResumo)); }

  dlg.setAttribute("data-view", "carrinho");
  raiz.NM = raiz.NM || {};
  raiz.NM.pedido = { obter: PED.obter, irParaDados: irParaDados };
})(typeof window !== "undefined" ? window : globalThis);
