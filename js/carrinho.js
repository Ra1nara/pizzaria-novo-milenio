/* =====================================================================
   PIZZARIA NOVO MILÊNIO — CARRINHO
   Interface do carrinho: lista, quantidade, remoção, resumo e acesso.
   Estado e valores em js/selecao.js (preço: js/montagem-regras.js).
   Dados do pedido e WhatsApp ficam em js/pedido.js e js/whatsapp.js.
   ===================================================================== */
(function () {
  "use strict";

  var CFG = window.NM_CONFIG, SEL = window.NM_SELECAO, NM = window.NM;
  var dlg = document.getElementById("carrinho");
  if (!CFG || !SEL || !NM || !dlg || typeof dlg.showModal !== "function") return;
  var esc = NM.esc;
  var TIPO = { salgada: "Salgada", doce: "Doce" };

  var el = {
    lista: dlg.querySelector(".cr-lista"),
    vazio: dlg.querySelector(".cr-vazio"),
    resumo: dlg.querySelector(".cr-resumo"),
    rodape: dlg.querySelector(".cr-rodape"),
    total: dlg.querySelector(".cr-total strong"),
    totalNota: dlg.querySelector(".cr-total small"),
    status: dlg.querySelector(".cr-status"),
    avancar: dlg.querySelector(".cr-avancar"),
    titulo: dlg.querySelector("#cr-titulo"),
    corpo: dlg.querySelector(".mt-corpo")
  };
  var acessos = Array.prototype.slice.call(document.querySelectorAll("[data-abrir-carrinho]"));
  var contadores = Array.prototype.slice.call(document.querySelectorAll("[data-carrinho-qtd]"));
  var barra = document.querySelector(".barra");
  var gatilho = null, viaHistorico = false, ultimoRemovido = null;

  function rotulo(t) { return CFG.tamanhos[t].rotulo; }
  function plural(n, s, p) { return n + " " + (n === 1 ? s : p); }
  function descricaoCurta(i) {
    if (i.tipo === "produto") return i.nome + " (" + i.grupo + ")";
    return "Pizza " + rotulo(i.tamanho) + " " + i.sabores.map(function (s) { return s.numero; }).join(" + ");
  }
  function textoContagem(r) {
    var partes = [];
    if (r.porCategoria.pizzas.quantidade) partes.push(plural(r.porCategoria.pizzas.quantidade, "pizza", "pizzas"));
    if (r.porCategoria.bebidas.quantidade) partes.push(plural(r.porCategoria.bebidas.quantidade, "bebida", "bebidas"));
    return partes.join(" · ");
  }

  /* ---------- Indicadores (cabeçalho e barra do celular) ---------- */
  function atualizarIndicadores() {
    var n = SEL.totalItens(), r = SEL.resumo();
    contadores.forEach(function (c) { c.textContent = n; });
    acessos.forEach(function (b) {
      b.setAttribute("aria-label", "Abrir carrinho, " + (n ? plural(n, "item", "itens") + ": " + textoContagem(r) : "vazio"));
      b.classList.toggle("tem-itens", n > 0);
    });
    if (barra) {
      barra.classList.toggle("tem-carrinho", n > 0);
      var txt = barra.querySelector("[data-barra-carrinho-txt]");
      if (txt) txt.textContent = n ? textoContagem(r) : "";
    }
  }

  /* ---------- Componentes ---------- */
  function htmlPreco(i) {
    if (i.precoUnitario) {
      return i.quantidade > 1
        ? '<span class="cr-unit">' + i.quantidade + ' × R$ ' + i.precoUnitario + '</span><strong><span class="rs">R$</span>' + i.precoLinha + "</strong>"
        : '<strong><span class="rs">R$</span>' + i.precoUnitario + "</strong>";
    }
    return '<strong class="cr-a-confirmar">Preço a confirmar</strong>';
  }
  function htmlAcoes(i) {
    var desc = descricaoCurta(i);
    return '<div class="cr-acoes">' +
      '<div class="cr-qtd" role="group" aria-label="Quantidade de ' + esc(desc) + '">' +
        '<button type="button" class="cr-menos" data-menos="' + i.id + '" aria-label="Diminuir quantidade de ' + esc(desc) + '"' + (i.quantidade <= 1 ? " disabled" : "") + '>−</button>' +
        '<output class="cr-n" aria-live="polite">' + i.quantidade + "</output>" +
        '<button type="button" class="cr-mais" data-mais="' + i.id + '" aria-label="Aumentar quantidade de ' + esc(desc) + '"' + (i.quantidade >= SEL.QTD_MAX ? " disabled" : "") + ">+</button>" +
      "</div>" +
      '<button type="button" class="cr-remover" data-remover-item="' + i.id + '" aria-label="Remover ' + esc(desc) + ' do carrinho">Remover</button>' +
    "</div>";
  }
  function htmlPizza(i) {
    return '<li class="cr-item" data-id="' + i.id + '">' +
      '<div class="cr-cab">' +
        '<p class="cr-tam cr-tam-' + i.tamanho + '">' + rotulo(i.tamanho) + ' <span>' + plural(i.sabores.length, "sabor", "sabores") + "</span></p>" +
        '<p class="cr-preco">' + htmlPreco(i) + "</p>" +
      "</div>" +
      '<ol class="cr-sabores">' + i.sabores.map(function (s) {
        return '<li><span class="pizza-n">' + s.numero + '</span><span class="cr-sab-nome">' + esc(s.nome) + '</span><span class="mt-tipo">' + TIPO[s.tipo] + "</span></li>";
      }).join("") + "</ol>" +
      '<p class="cr-borda"><span>Borda</span>' + (i.borda ? esc(i.borda.nome) + ' <em>+ R$ ' + i.borda.preco + "</em>" : "Sem borda") + "</p>" +
      (i.observacao ? '<p class="cr-obs"><span>Observações</span>' + esc(i.observacao) + "</p>" : "") +
      // Só apresentação: valores vêm de NM_SELECAO (precoMontado), sem mudança na regra
      (i.precoBase ? '<p class="cr-conta">Subtotal: R$ ' + i.precoBase +
        (i.borda ? "<br>Borda " + esc(i.borda.nome) + ": + R$ " + i.borda.preco : "") +
        "<br><strong>Total da pizza: R$ " + i.precoUnitario + (i.quantidade > 1 ? " cada" : "") + "</strong></p>" : "") +
      htmlAcoes(i) + "</li>";
  }
  function htmlProduto(i) {
    return '<li class="cr-item cr-produto" data-id="' + i.id + '">' +
      '<div class="cr-cab">' +
        '<p class="cr-prod"><span class="pizza-n">' + i.numero + '</span><span class="cr-prod-txt"><span class="cr-sab-nome">' + esc(i.nome) + '</span><span class="mt-tipo">' + esc(i.grupo) + "</span></span></p>" +
        '<p class="cr-preco">' + htmlPreco(i) + "</p>" +
      "</div>" +
      htmlAcoes(i) + "</li>";
  }
  function secao(titulo, sub, conteudo) {
    return '<li class="cr-secao"><p class="subgrupo cr-subgrupo">' + titulo + (sub ? ' <span>' + sub + "</span>" : "") + '</p><ul class="cr-sublista">' + conteudo + "</ul></li>";
  }

  /* ---------- Render do carrinho ---------- */
  function render() {
    var itens = SEL.listarDetalhado(), r = SEL.resumo(), pc = r.porCategoria;
    var vazio = itens.length === 0;
    el.vazio.hidden = !vazio;
    el.lista.hidden = vazio;
    el.resumo.hidden = vazio;
    el.rodape.hidden = vazio;
    el.titulo.textContent = vazio ? "Seu carrinho" : "Seu carrinho · " + plural(r.totalItens, "item", "itens");

    var pizzas = itens.filter(function (i) { return i.categoria === "pizza"; });
    var bebidas = itens.filter(function (i) { return i.categoria === "bebida"; });
    el.lista.innerHTML =
      (pizzas.length ? secao("Pizzas", plural(pc.pizzas.quantidade, "unidade", "unidades"), pizzas.map(htmlPizza).join("")) : "") +
      (bebidas.length ? secao("Bebidas", plural(pc.bebidas.quantidade, "unidade", "unidades"), bebidas.map(htmlProduto).join("")) : "");

    // Resumo por categoria (valores de NM_SELECAO.resumo(), os mesmos da mensagem do WhatsApp)
    var linhas = "";
    if (pc.pizzas.quantidade) {
      linhas += '<div class="mt-res-linha"><span>Pizzas</span><strong><span class="rs">R$</span>' + pc.pizzas.subtotalConhecido + "</strong><em>" + plural(pc.pizzas.quantidade, "pizza", "pizzas") +
            (r.bordasNasPizzas.quantidade ? " · inclui " + plural(r.bordasNasPizzas.quantidade, "borda", "bordas") + " (R$ " + r.bordasNasPizzas.valor + ")" : "") + "</em></div>";
    }
    if (pc.bebidas.quantidade) linhas += '<div class="mt-res-linha"><span>Bebidas</span><strong><span class="rs">R$</span>' + pc.bebidas.subtotalConhecido + "</strong><em>" + plural(pc.bebidas.quantidade, "bebida", "bebidas") + "</em></div>";
    if (r.pizzasAConfirmar === 0) {
      linhas += '<div class="mt-res-linha cr-res-total"><span>Total</span><strong><span class="rs">R$</span>' + r.subtotalConhecido + "</strong><em>Soma dos itens do cardápio.</em></div>";
    } else {
      // Proteção: só ocorre se faltar preço em cardapio-dados.js (hoje todos os itens têm preço)
      linhas += '<div class="mt-res-linha cr-res-total"><span>Total</span><strong class="cr-a-confirmar">A confirmar</strong><em>Há item sem preço no cardápio.</em></div>';
    }
    el.resumo.querySelector(".cr-resumo-conteudo").innerHTML = linhas;

    // Rodapé
    if (r.pizzasAConfirmar === 0) {
      el.total.innerHTML = '<span class="rs">R$</span>' + r.subtotalConhecido;
      el.totalNota.textContent = "Total · " + plural(r.totalItens, "item", "itens");
      el.total.parentNode.classList.remove("a-confirmar");
    } else {
      el.total.textContent = "A confirmar";
      el.totalNota.textContent = "Subtotal conhecido R$ " + r.subtotalConhecido;
      el.total.parentNode.classList.add("a-confirmar");
    }
    el.avancar.disabled = vazio;
  }

  /* ---------- Abrir / fechar ---------- */
  function abrir(origem) {
    gatilho = origem || document.activeElement;
    el.status.textContent = "";
    ultimoRemovido = null;
    render();
    document.documentElement.classList.add("mt-aberto");
    dlg.showModal();
    el.corpo.scrollTop = 0;
    try { history.pushState({ nmCarrinho: true }, ""); } catch (e) {}
    el.titulo.focus();
  }
  function fechar() { if (dlg.open) dlg.close(); }

  dlg.addEventListener("close", function () {
    document.documentElement.classList.remove("mt-aberto");
    if (!viaHistorico && history.state && history.state.nmCarrinho) { try { history.back(); } catch (e) {} }
    viaHistorico = false;
    if (gatilho && document.body.contains(gatilho) && gatilho.focus) gatilho.focus();
  });
  window.addEventListener("popstate", function () { if (dlg.open) { viaHistorico = true; dlg.close(); } });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) fechar(); });
  Array.prototype.forEach.call(dlg.querySelectorAll("[data-cr-fechar]"), function (b) { b.addEventListener("click", fechar); });
  acessos.forEach(function (b) { b.addEventListener("click", function () { abrir(b); }); });

  // "Ver cardápio" (estado vazio): fecha e leva ao cardápio
  dlg.querySelector("[data-cr-cardapio]").addEventListener("click", function () {
    gatilho = null;
    fechar();
    var alvo = document.getElementById("cardapio");
    if (alvo) { alvo.scrollIntoView(); var q = document.getElementById("q"); if (q) q.focus({ preventScroll: true }); }
  });

  /* ---------- Ações nos itens ---------- */
  el.lista.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b || b.disabled) return;
    var id;
    if ((id = b.getAttribute("data-mais"))) { SEL.alterarQuantidade(id, +1); focoEm('[data-mais="' + id + '"]'); return; }
    if ((id = b.getAttribute("data-menos"))) { SEL.alterarQuantidade(id, -1); focoEm('[data-menos="' + id + '"]', '[data-mais="' + id + '"]'); return; }
    if ((id = b.getAttribute("data-remover-item"))) {
      var item = SEL.listarDetalhado().filter(function (i) { return i.id === id; })[0];
      ultimoRemovido = SEL.remover(id);
      el.status.innerHTML = esc(descricaoCurta(item)) + (item.tipo === "produto" ? " removido." : " removida.") + ' <button type="button" class="cr-desfazer">Desfazer</button>';
      var d = el.status.querySelector(".cr-desfazer");
      if (d) d.focus(); else el.titulo.focus();
    }
  });
  el.status.addEventListener("click", function (e) {
    if (!e.target.closest(".cr-desfazer") || !ultimoRemovido) return;
    SEL.restaurar(ultimoRemovido);
    var id = ultimoRemovido.item.id;
    ultimoRemovido = null;
    el.status.textContent = "Item devolvido ao carrinho.";
    focoEm('[data-remover-item="' + id + '"]');
  });
  function focoEm(sel, alternativa) {
    var x = el.lista.querySelector(sel);
    if (x && x.disabled && alternativa) x = el.lista.querySelector(alternativa);
    if (x) x.focus();
  }

  /* ---------- Avançar → tela de dados do pedido (js/pedido.js) ---------- */
  el.avancar.addEventListener("click", function () {
    document.dispatchEvent(new CustomEvent("nm:avancar-pedido", { detail: SEL.pedido() }));
  });

  /* ---------- Aviso breve ao adicionar bebida (pizzas já avisam pela montagem) ---------- */
  var toast = document.querySelector(".nm-toast"), timerToast;
  function avisarProduto(item) {
    if (!toast) return;
    var p = SEL.produto(item.chave);
    toast.textContent = "Adicionado: " + p.item.nome + " (" + p.grupo + ") · no carrinho: " + item.quantidade + ".";
    toast.classList.add("on");
    clearTimeout(timerToast);
    timerToast = setTimeout(function () { toast.classList.remove("on"); }, 3500);
  }

  /* ---------- Reações ao estado ---------- */
  document.addEventListener("nm:carrinho", function (e) {
    atualizarIndicadores();
    if (e.detail && e.detail.tipo === "adicionado" && e.detail.item && e.detail.item.tipo === "produto") avisarProduto(e.detail.item);
    if (dlg.open) render();
  });

  // Barra do celular: com itens no carrinho ela vira o acesso ao carrinho;
  // some enquanto a pessoa digita na busca do cardápio (teclado aberto).
  var q = document.getElementById("q");
  if (q && barra) {
    q.addEventListener("focus", function () { barra.classList.add("digitando"); });
    q.addEventListener("blur", function () { barra.classList.remove("digitando"); });
  }

  atualizarIndicadores();
  /* ---------- Confirmação genérica de item adicionado ----------
     confirmar({ titulo, linhas: [..] }) → título + linhas + botão "Ver carrinho →".
     Não conhece o tipo do item (o título vem de quem chama), não altera o carrinho. */
  var DURACAO = 6000;
  function esconderAviso() { toast.classList.remove("on"); }
  function agendarAviso() { clearTimeout(timerToast); timerToast = setTimeout(esconderAviso, DURACAO); }
  function confirmar(opcoes) {
    if (!toast || !opcoes) return;
    toast.innerHTML =
      '<strong class="nm-toast-tit">' + esc(opcoes.titulo || "Adicionado ao carrinho!") + "</strong>" +
      (opcoes.linhas || []).map(function (l) { return '<span class="nm-toast-linha">' + esc(l) + "</span>"; }).join("") +
      '<button type="button" class="nm-toast-acao" data-toast-carrinho>Ver carrinho <span aria-hidden="true">→</span></button>';
    toast.classList.add("on");
    agendarAviso();
  }
  if (toast) {
    toast.addEventListener("click", function (e) {
      if (!e.target.closest("[data-toast-carrinho]")) return;
      clearTimeout(timerToast);
      esconderAviso();
      abrir(e.target.closest("[data-toast-carrinho]"));
    });
    // Enquanto o mouse ou o foco estiverem no aviso, ele não some
    toast.addEventListener("mouseenter", function () { clearTimeout(timerToast); });
    toast.addEventListener("mouseleave", function () { if (toast.classList.contains("on")) agendarAviso(); });
    toast.addEventListener("focusin", function () { clearTimeout(timerToast); });
    toast.addEventListener("focusout", function () { if (toast.classList.contains("on")) agendarAviso(); });
  }

  NM.carrinho = { abrir: abrir, fechar: fechar, confirmar: confirmar };
})();
