/* =====================================================================
   PIZZARIA NOVO MILÊNIO — ENVIO DO PEDIDO PELO WHATSAPP (Etapa 7)

   Monta a mensagem a partir do estado que já existe:
   - NM_PEDIDO.obter()          → dados do comprador + recebimento
   - NM_SELECAO.listarDetalhado → pizzas/bebidas com nomes do cardápio
   - NM_SELECAO.resumo()        → os MESMOS valores mostrados no carrinho
   Nenhum preço é recalculado aqui.

   Abre o WhatsApp oficial da pizzaria com a mensagem preenchida.
   Nada é enviado sem a pessoa tocar em "enviar" dentro do WhatsApp.
   ===================================================================== */
(function (raiz) {
  "use strict";

  function cfg() { return raiz.NM_CONFIG; }
  function sel() { return raiz.NM_SELECAO; }
  function ped() { return raiz.NM_PEDIDO; }

  /** Destino único: WhatsApp oficial da pizzaria (config.js). */
  function destino() { return cfg().empresa.whatsapp.link; } // https://wa.me/5511962248186

  function rotulo(t) { return cfg().tamanhos[t].rotulo; }

  /* ---------- Mensagem ---------- */
  function mensagem() {
    var p = ped().obter(), c = p.comprador;
    var itens = sel().listarDetalhado(), r = sel().resumo(), pc = r.porCategoria;
    var e = cfg().empresa.endereco;
    var L = [];

    L.push("*NOVO PEDIDO — PIZZARIA NOVO MILÊNIO*");
    L.push("");
    L.push("*Dados do pedido*");
    L.push("Nome: " + c.nome);
    L.push("WhatsApp: " + c.whatsapp);
    L.push("Recebimento: " + (c.recebimento === "retirada" ? "Retirada" : "Delivery"));
    L.push("");

    if (c.recebimento === "retirada") {
      // Na retirada, NUNCA usa endereço digitado: só o endereço oficial da loja
      L.push("*Retirada na loja*");
      L.push(e.linha1 + " – " + e.bairro);
      L.push(e.cidade);
      L.push(e.cep);
    } else {
      L.push("*Entrega*");
      L.push("Endereço: " + c.endereco + ", " + c.numero);
      if (c.complemento) L.push("Complemento: " + c.complemento);
      if (c.referencia) L.push("Referência: " + c.referencia);
    }
    if (c.observacoesEntrega) {
      L.push("Observações da entrega:");
      L.push(c.observacoesEntrega);
    }

    var pizzas = itens.filter(function (i) { return i.categoria === "pizza"; });
    var bebidas = itens.filter(function (i) { return i.categoria === "bebida"; });

    if (pizzas.length) {
      L.push("");
      L.push("*Pizzas*");
      pizzas.forEach(function (i, k) {
        if (k) L.push("");
        L.push(i.quantidade + "x Pizza " + rotulo(i.tamanho));
        i.sabores.forEach(function (s) { L.push("• " + s.numero + " — " + s.nome); });
        L.push("• Borda: " + (i.borda ? i.borda.nome : "sem borda"));
        if (i.observacao) L.push("• Observação: " + i.observacao);
        if (i.quantidade > 1) {
          L.push("• Valor unitário: " + (i.precoUnitario ? "R$ " + i.precoUnitario : "a confirmar"));
          L.push("• Subtotal: " + (i.precoLinha ? "R$ " + i.precoLinha : "a confirmar"));
        } else {
          L.push("• Valor: " + (i.precoUnitario ? "R$ " + i.precoUnitario : "a confirmar"));
        }
      });
    }

    if (bebidas.length) {
      L.push("");
      L.push("*Bebidas*");
      bebidas.forEach(function (i) {
        L.push("• " + i.quantidade + "x " + i.nome + " — R$ " + i.precoLinha + (i.quantidade > 1 ? " (R$ " + i.precoUnitario + " cada)" : ""));
      });
    }

    L.push("");
    L.push("*Resumo*");
    if (pc.pizzas.quantidade) L.push("Subtotal das pizzas: R$ " + pc.pizzas.subtotalConhecido);
    if (pc.bebidas.quantidade) L.push("Bebidas: R$ " + pc.bebidas.subtotalConhecido);
    L.push("Total do pedido: " + (r.totalDefinido ? "R$ " + r.subtotalConhecido : "a confirmar"));
    L.push("");
    // Somente a forma escolhida pela pessoa (validada antes do envio)
    L.push("Forma de pagamento: " + (p.pagamento && p.pagamento.rotulo ? p.pagamento.rotulo : "a confirmar pelo WhatsApp."));

    return L.join("\n");
  }

  /** Link wa.me com a mensagem inteira codificada (acentos, &, +, #, quebras de linha). */
  function link() { return destino() + "?text=" + encodeURIComponent(mensagem()); }

  /**
   * Abre o WhatsApp da pizzaria com o pedido. Chamar somente a partir de um
   * clique da pessoa. Retorna { ok, motivo, url }.
   */
  function enviar() {
    var v = ped().validar();
    if (!v.valido) return { ok: false, motivo: "dados" };
    if (!sel().totalItens()) return { ok: false, motivo: "vazio" };
    var url = link();
    // Abre em nova aba/app. Com "noopener" o navegador não informa se abriu,
    // por isso a tela mostra também um link manual para o mesmo endereço.
    try { raiz.open(url, "_blank", "noopener"); } catch (e) {}
    return { ok: true, url: url };
  }

  raiz.NM_WHATSAPP = { destino: destino, mensagem: mensagem, link: link, enviar: enviar };

  /* =================================================================
     Botões de entrada do pedido "Montar meu pedido" (data-cta-pedido)
     - Sem pizzas/bebidas no carrinho: seguem o link para o cardápio (#cardapio).
     - Com itens: levam ao fluxo de pedido (carrinho; se os dados já
       estiverem válidos, direto para a tela final de envio).
     O WhatsApp só abre no envio final (enviar()). Os links de CONTATO
     ("Onde estamos" e rodapé) continuam abrindo a conversa direta.
     ================================================================= */
  if (!raiz.document) return;
  raiz.document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-cta-pedido]");
    if (!a || !sel() || !sel().totalItens() || !raiz.NM || !raiz.NM.carrinho) return;
    e.preventDefault();
    raiz.NM.carrinho.abrir(a);
    if (ped() && ped().estaPronto() && raiz.NM.pedido) raiz.NM.pedido.irParaDados();
  });
})(typeof window !== "undefined" ? window : globalThis);
