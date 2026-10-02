/* =====================================================================
   PIZZARIA NOVO MILÊNIO — DADOS DO PEDIDO: INTERFACE (Etapa 6)
   Funciona dentro do mesmo painel do carrinho, em três telas:
     carrinho → dados do pedido → revisão
   Voltar (seta, Esc ou botão do celular) retorna uma tela sem perder nada.
   NÃO envia nada, NÃO abre WhatsApp, NÃO trata pagamento.
   Carregado ANTES de js/carrinho.js para tratar o "voltar" primeiro.
   ===================================================================== */
(function () {
  "use strict";

  var CFG = window.NM_CONFIG, SEL = window.NM_SELECAO, PED = window.NM_PEDIDO;
  var dlg = document.getElementById("carrinho");
  if (!CFG || !SEL || !PED || !dlg) return;

  var titulo = dlg.querySelector("#cr-titulo");
  var form = dlg.querySelector("#pd-form");
  var resumoDados = dlg.querySelector(".pd-resumo");
  var resumoRevisao = dlg.querySelector(".rv-conteudo");
  var caixaErros = dlg.querySelector(".pd-erros");
  var totalDados = dlg.querySelector(".pd-total");
  var corpos = { dados: dlg.querySelector('.pd-corpo[data-view-pane="dados"]'), revisao: dlg.querySelector('.pd-corpo[data-view-pane="revisao"]') };
  var CAMPOS = ["nome", "whatsapp", "endereco", "complemento", "referencia", "observacoes"];
  var TIPO = { salgada: "Salgada", doce: "Doce" };
  var TITULOS = { dados: "Dados do pedido", revisao: "Revisão do pedido" };

  var pilha = [];            // telas abertas além do carrinho: ["dados"] ou ["dados","revisao"]
  var ignorarPop = 0;        // "voltar" disparado por nós mesmos
  var tentouEnviar = false;  // só mostra erros após a 1ª tentativa (ou ao sair do campo)

  function esc(s) { return window.NM && NM.esc ? NM.esc(s) : String(s); }
  function telaAtual() { return pilha.length ? pilha[pilha.length - 1] : "carrinho"; }
  function plural(n, s, p) { return n + " " + (n === 1 ? s : p); }

  /* ---------- Troca de telas dentro do painel ---------- */
  function mostrar(tela) {
    dlg.setAttribute("data-view", tela);
    if (tela !== "carrinho") titulo.textContent = TITULOS[tela];
    else if (window.NM && NM.carrinho) document.dispatchEvent(new CustomEvent("nm:carrinho", { detail: { tipo: "redesenhar" } }));
    if (corpos[tela]) corpos[tela].scrollTop = 0;
    titulo.focus();
  }
  function avancarPara(tela) {
    pilha.push(tela);
    try { history.pushState({ nmPedido: tela }, ""); } catch (e) {}
    mostrar(tela);
  }
  function voltarUmaTela() {
    if (!pilha.length) return false;
    pilha.pop();
    if (history.state && history.state.nmPedido) { ignorarPop += 1; try { history.back(); } catch (e) { ignorarPop -= 1; } }
    mostrar(telaAtual());
    return true;
  }

  // Botão "voltar" do celular / navegador
  window.addEventListener("popstate", function (e) {
    if (ignorarPop > 0) { ignorarPop -= 1; e.stopImmediatePropagation(); return; }
    if (dlg.open && pilha.length) { e.stopImmediatePropagation(); pilha.pop(); mostrar(telaAtual()); }
  });
  // Seta / X do cabeçalho: nas telas de pedido voltam uma tela em vez de fechar
  dlg.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cr-fechar]");
    if (b && pilha.length && b.closest(".mt-topo")) { e.stopPropagation(); e.preventDefault(); voltarUmaTela(); }
  }, true);
  // Esc: volta uma tela
  dlg.addEventListener("cancel", function (e) { if (pilha.length) { e.preventDefault(); voltarUmaTela(); } });
  // Fechou o painel (fundo, etc.) estando no pedido: limpa o histórico extra e volta ao estado inicial
  dlg.addEventListener("close", function () {
    if (pilha.length) {
      var extras = pilha.length;
      pilha = [];
      if (history.state && history.state.nmPedido) {
        ignorarPop += 1;
        try { history.go(-(extras + 1)); } catch (e) { ignorarPop -= 1; }
      }
    }
    dlg.setAttribute("data-view", "carrinho");
  });

  /* ---------- Entrada a partir do carrinho ("Avançar") ---------- */
  document.addEventListener("nm:avancar-pedido", function (e) {
    if (e.detail) e.detail.tratado = true;
    if (!SEL.totalPizzas()) return;
    preencherFormulario();
    tentouEnviar = false;
    limparErros();
    renderResumo();
    avancarPara("dados");
  });

  /* ---------- Formulário ---------- */
  function campo(nome) { return form.elements[nome]; }
  function preencherFormulario() {
    var d = PED.dados();
    CAMPOS.forEach(function (k) { campo(k).value = d[k]; });
    Array.prototype.forEach.call(form.querySelectorAll('input[name="tipoEntrega"]'), function (r) { r.checked = r.value === d.tipoEntrega; });
    aplicarTipoEntrega(d.tipoEntrega);
  }
  function aplicarTipoEntrega(tipo) {
    var delivery = tipo === "delivery", retirada = tipo === "retirada";
    form.querySelector(".pd-endereco").hidden = !delivery;
    form.querySelector(".pd-retirada").hidden = !retirada;
    form.querySelector(".pd-escolha-primeiro").hidden = delivery || retirada;
    Array.prototype.forEach.call(form.querySelectorAll(".pd-op"), function (l) {
      l.classList.toggle("ativo", l.querySelector("input").value === tipo);
    });
    campo("endereco").required = delivery;
  }

  form.addEventListener("input", function (e) {
    var t = e.target;
    if (!t.name) return;
    var parcial = {}; parcial[t.name] = t.value;
    PED.atualizar(parcial);
    if (t.name === "tipoEntrega") aplicarTipoEntrega(t.value);
    if (tentouEnviar) mostrarErros(PED.validar().erros, false);
  });
  form.addEventListener("change", function (e) {
    if (e.target.name === "tipoEntrega") { PED.atualizar({ tipoEntrega: e.target.value }); aplicarTipoEntrega(e.target.value); if (tentouEnviar) mostrarErros(PED.validar().erros, false); }
  });
  // Ao sair de um campo obrigatório preenchido incorretamente, avisa ali mesmo
  form.addEventListener("focusout", function (e) {
    var n = e.target.name;
    if (!n || (n !== "nome" && n !== "whatsapp" && n !== "endereco")) return;
    if (!e.target.value.trim() && !tentouEnviar) return;
    var erros = PED.validar().erros;
    erroCampo(n, erros[n] || "");
  });
  // Teclado do celular: mantém o campo ativo visível
  form.addEventListener("focusin", function (e) {
    if (!/^(INPUT|TEXTAREA)$/.test(e.target.tagName) || e.target.type === "radio") return;
    setTimeout(function () { try { e.target.scrollIntoView({ block: "center" }); } catch (x) {} }, 300);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    tentouEnviar = true;
    var v = PED.validar();
    if (!v.valido) { mostrarErros(v.erros, true); return; }
    limparErros();
    PED.registrar();
    renderRevisao();
    avancarPara("revisao");
  });

  /* ---------- Erros: texto + aria-invalid (nunca só cor) ---------- */
  function erroCampo(nome, msg) {
    var p = form.querySelector("#pd-erro-" + nome);
    if (!p) return;
    p.textContent = msg ? "⚠ " + msg : "";
    p.hidden = !msg;
    if (nome === "tipoEntrega") {
      form.querySelector(".pd-entrega").classList.toggle("com-erro", !!msg);
      Array.prototype.forEach.call(form.querySelectorAll('input[name="tipoEntrega"]'), function (r) { r.setAttribute("aria-invalid", msg ? "true" : "false"); });
    } else {
      campo(nome).setAttribute("aria-invalid", msg ? "true" : "false");
    }
  }
  function mostrarErros(erros, focar) {
    ["tipoEntrega", "nome", "whatsapp", "endereco"].forEach(function (k) { erroCampo(k, erros[k] || ""); });
    var lista = Object.keys(erros);
    caixaErros.hidden = !lista.length;
    caixaErros.innerHTML = lista.length ? "<strong>Confira " + plural(lista.length, "item", "itens") + " antes de continuar:</strong><ul>" +
      lista.map(function (k) { return '<li><a href="#' + (k === "tipoEntrega" ? "pd-entrega-delivery" : "pd-" + k) + '">' + esc(erros[k]) + "</a></li>"; }).join("") + "</ul>" : "";
    if (focar && lista.length) {
      var primeiro = lista[0] === "tipoEntrega" ? form.querySelector("#pd-entrega-delivery") : campo(lista[0]);
      primeiro.focus();
    }
  }
  function limparErros() { mostrarErros({}, false); }
  caixaErros.addEventListener("click", function (e) {
    var a = e.target.closest("a"); if (!a) return;
    e.preventDefault();
    var alvo = form.querySelector(a.getAttribute("href"));
    if (alvo) alvo.focus();
  });

  /* ---------- Resumo das pizzas (mesma lógica de preço do carrinho) ---------- */
  function htmlPizzas() {
    var itens = SEL.listarDetalhado();
    return '<ul class="pd-pizzas">' + itens.map(function (i) {
      var preco = i.precoUnitario
        ? (i.quantidade > 1 ? '<span class="cr-unit">' + i.quantidade + " × R$ " + i.precoUnitario + '</span><strong><span class="rs">R$</span>' + i.precoLinha + "</strong>" : '<strong><span class="rs">R$</span>' + i.precoUnitario + "</strong>")
        : '<strong class="cr-a-confirmar">Preço a confirmar</strong>';
      return '<li class="pd-pizza">' +
        '<div class="cr-cab"><p class="cr-tam cr-tam-' + i.tamanho + '">' + i.quantidade + "× " + CFG.tamanhos[i.tamanho].rotulo + " <span>" + plural(i.sabores.length, "sabor", "sabores") + '</span></p><p class="cr-preco">' + preco + "</p></div>" +
        '<ol class="cr-sabores">' + i.sabores.map(function (s) {
          return '<li><span class="pizza-n">' + s.numero + '</span><span class="cr-sab-nome">' + esc(s.nome) + '</span><span class="mt-tipo">' + TIPO[s.tipo] + "</span></li>";
        }).join("") + "</ol>" +
        (i.observacao ? '<p class="cr-obs"><span>Observações da pizza</span>' + esc(i.observacao) + "</p>" : "") +
        "</li>";
    }).join("") + "</ul>";
  }
  function htmlTotais() {
    var r = SEL.resumo();
    if (!r.pizzasAConfirmar) return '<div class="mt-res-linha cr-res-total"><span>Total das pizzas</span><strong><span class="rs">R$</span>' + r.subtotalConhecido + "</strong></div>";
    return '<div class="mt-res-linha"><span>Subtotal conhecido</span><strong><span class="rs">R$</span>' + r.subtotalConhecido + "</strong><em>" + plural(r.pizzasComPreco, "pizza", "pizzas") + " de 1 sabor</em></div>" +
      '<div class="mt-res-linha"><span>A confirmar</span><strong>' + plural(r.pizzasAConfirmar, "pizza", "pizzas") + "</strong><em>Com 2 ou 3 sabores: o valor será confirmado pela pizzaria.</em></div>" +
      '<div class="mt-res-linha cr-res-total"><span>Total final</span><strong class="cr-a-confirmar">A confirmar</strong></div>';
  }
  function htmlRodapeTotal() {
    var r = SEL.resumo();
    return r.pizzasAConfirmar
      ? "<small>Subtotal conhecido R$ " + r.subtotalConhecido + '</small><strong class="cr-a-confirmar">A confirmar</strong>'
      : '<small>Total das pizzas · ' + plural(r.totalPizzas, "pizza", "pizzas") + '</small><strong><span class="rs">R$</span>' + r.subtotalConhecido + "</strong>";
  }
  function renderResumo() {
    resumoDados.innerHTML = htmlPizzas() + '<div class="mt-resumo-conteudo pd-totais">' + htmlTotais() + "</div>";
    totalDados.innerHTML = htmlRodapeTotal();
  }

  /* ---------- Revisão (dados registrados — nada enviado) ---------- */
  function linha(rotulo, valor) { return '<div class="mt-res-linha"><span>' + rotulo + "</span><p>" + valor + "</p></div>"; }
  function renderRevisao() {
    var p = PED.obter(), d = p.dadosCliente;
    var receber = d.tipoEntrega === "retirada"
      ? linha("Recebimento", "<strong>Retirada</strong>") + linha("Local de retirada", esc(p.localRetirada))
      : linha("Recebimento", "<strong>Delivery</strong>") + linha("Endereço", esc(d.endereco)) +
        (d.complemento ? linha("Complemento", esc(d.complemento)) : "") +
        (d.referencia ? linha("Referência", esc(d.referencia)) : "");
    resumoRevisao.innerHTML =
      '<section class="mt-bloco"><h3 class="mt-h">Seus dados</h3><div class="mt-resumo-conteudo">' +
        linha("Nome", esc(d.nome)) + linha("WhatsApp", esc(d.whatsapp)) + receber +
        linha("Observações do pedido", d.observacoes ? esc(d.observacoes) : "Nenhuma") +
      "</div></section>" +
      '<section class="mt-bloco"><h3 class="mt-h">' + plural(SEL.totalPizzas(), "pizza", "pizzas") + "</h3>" + htmlPizzas() +
        '<div class="mt-resumo-conteudo pd-totais">' + htmlTotais() + "</div></section>";
    dlg.querySelector(".rv-total").innerHTML = htmlRodapeTotal();
  }

  dlg.querySelector("[data-pd-carrinho]").addEventListener("click", function () { voltarUmaTela(); });
  dlg.querySelector("[data-rv-alterar]").addEventListener("click", function () { voltarUmaTela(); });

  dlg.setAttribute("data-view", "carrinho");
  window.NM = window.NM || {};
  NM.pedido = { obter: PED.obter, tela: telaAtual };
})();
