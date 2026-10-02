/* =====================================================================
   PIZZARIA NOVO MILÊNIO — ESTADO DO CARRINHO
   Fonte única do que foi escolhido. Guarda apenas REFERÊNCIAS ao
   cardápio; nomes, categorias e preços são sempre lidos de
   js/cardapio-dados.js (via NM_REGRAS para pizzas).

   Dois tipos de item:
   - Pizza:   { id, tipo: "pizza", tamanho, sabores: ["33","20"], borda: "01" | "", observacao, quantidade }
              (a borda PERTENCE à pizza; não existe borda solta no carrinho)
   - Produto: { id, tipo: "produto", chave: "bebida:refrigerantes:05", quantidade }

   Preço da pizza = maior preço entre os sabores (no tamanho) + preço da borda.
   (regra em js/montagem-regras.js → precoMontado)

   Agrupamento:
   - Pizza idêntica (mesmo tamanho, mesmos sabores em qualquer ordem,
     mesma borda e mesma observação) soma na quantidade.
   - Bebida com a mesma chave soma na quantidade.
   ===================================================================== */
(function (raiz) {
  "use strict";

  var CHAVE = "nm-carrinho-v1";
  var QTD_MAX = 99;
  var itens = [];
  var contador = 0;

  /* ---------- utilidades ---------- */
  function novoId(prefixo) { contador += 1; return (prefixo || "p") + "-" + Date.now().toString(36) + "-" + contador; }
  function ehPizza(i) { return i.tipo !== "produto"; }
  function copia(i) {
    if (!ehPizza(i)) return { id: i.id, tipo: "produto", chave: i.chave, quantidade: i.quantidade };
    return { id: i.id, tipo: "pizza", tamanho: i.tamanho, sabores: i.sabores.slice(), borda: i.borda || "", observacao: i.observacao, quantidade: i.quantidade };
  }
  function normalizaObs(t) { return String(t || "").replace(/\s+/g, " ").trim(); }
  function assinaturaPizza(tamanho, sabores, borda, obs) {
    return "pizza|" + tamanho + "|" + sabores.slice().sort().join(",") + "|borda:" + (borda || "-") + "|" + normalizaObs(obs).toLowerCase();
  }
  function assinatura(i) { return ehPizza(i) ? assinaturaPizza(i.tamanho, i.sabores, i.borda, i.observacao) : "produto|" + i.chave; }
  function acha(id) { for (var k = 0; k < itens.length; k++) if (itens[k].id === id) return k; return -1; }

  /* ---------- produtos avulsos (bebidas) lidos do cardápio ---------- */
  /**
   * Resolve uma chave para a bebida do cardápio, ou null.
   * "bebida:refrigerantes:05" -> grupo de bebidas "refrigerantes", nº 05
   * Bordas NÃO são produtos avulsos: pertencem à pizza (campo "borda").
   */
  function produto(chave) {
    var D = raiz.NM_CARDAPIO, partes = String(chave || "").split(":"), i, g;
    if (!D) return null;
    if (partes[0] === "bebida" && partes.length === 3) {
      for (g = 0; g < D.bebidas.length; g++) {
        if (D.bebidas[g].id !== partes[1]) continue;
        for (i = 0; i < D.bebidas[g].itens.length; i++) {
          if (D.bebidas[g].itens[i].numero === partes[2]) {
            return { chave: chave, categoria: "bebida", categoriaTitulo: "Bebidas", grupo: D.bebidas[g].titulo, item: D.bebidas[g].itens[i] };
          }
        }
      }
    }
    return null;
  }

  function valido(i) {
    if (!i) return false;
    if (i.tipo === "produto") return !!produto(i.chave);
    var R = raiz.NM_REGRAS;
    if (typeof i.tamanho !== "string" || !Array.isArray(i.sabores)) return false;
    if (i.borda && R && !R.borda(i.borda)) return false;
    return R ? R.validar(i.tamanho, i.sabores).valida : true;
  }

  /* ---------- persistência (opcional, falha silenciosa) ---------- */
  function salvar() {
    try { raiz.localStorage.setItem(CHAVE, JSON.stringify(itens)); } catch (e) {}
  }
  function carregar() {
    try {
      var bruto = JSON.parse(raiz.localStorage.getItem(CHAVE) || "[]");
      if (!Array.isArray(bruto)) return;
      bruto.forEach(function (i) {
        if (!valido(i)) return; // descarta o que não bate com o cardápio/regras atuais
        var q = Math.min(Math.max(Math.floor(Number(i.quantidade) || 1), 1), QTD_MAX);
        var id = typeof i.id === "string" ? i.id : novoId();
        if (i.tipo === "produto") itens.push({ id: id, tipo: "produto", chave: String(i.chave), quantidade: q });
        else itens.push({ id: id, tipo: "pizza", tamanho: i.tamanho, sabores: i.sabores.map(String), borda: i.borda ? String(i.borda) : "", observacao: normalizaObs(i.observacao), quantidade: q });
      });
    } catch (e) { itens = []; }
  }

  function totalPizzas() { return itens.reduce(function (s, i) { return s + (ehPizza(i) ? i.quantidade : 0); }, 0); }
  function totalItens() { return itens.reduce(function (s, i) { return s + i.quantidade; }, 0); }

  function avisar(tipo, detalhe) {
    salvar();
    if (!raiz.document || typeof CustomEvent !== "function") return;
    detalhe = detalhe || {};
    detalhe.tipo = tipo;
    detalhe.totalPizzas = totalPizzas();
    detalhe.totalItens = totalItens();
    raiz.document.dispatchEvent(new CustomEvent("nm:carrinho", { detail: detalhe }));
  }

  /* ---------- preço ----------
     Conversão e formatação vêm de js/montagem-regras.js (uma única implementação).
     Preço da pizza: NM_REGRAS.precoMontado (maior preço entre os sabores + borda).
     Aqui só se multiplica pela quantidade e se soma. */
  function centavos(texto) { return raiz.NM_REGRAS.centavos(texto); } // "1.019,90" -> 101990
  function formata(c) { return raiz.NM_REGRAS.formata(c); }            // 10380 -> "103,80" 
  function precoUnitario(i) {
    if (ehPizza(i)) { var m = raiz.NM_REGRAS.precoMontado(i.tamanho, i.sabores, i.borda); return m ? m.total : null; }
    var p = produto(i.chave);
    return p ? p.item.preco : null;
  }

  /** Item com os dados do cardápio resolvidos (para exibir). */
  function detalhar(i) {
    var unit = precoUnitario(i);
    var base = {
      id: i.id, tipo: ehPizza(i) ? "pizza" : "produto", quantidade: i.quantidade,
      precoUnitario: unit,
      precoLinha: unit ? formata(centavos(unit) * i.quantidade) : null
    };
    if (ehPizza(i)) {
      var R = raiz.NM_REGRAS;
      var m = R.precoMontado(i.tamanho, i.sabores, i.borda), b = R.borda(i.borda);
      base.categoria = "pizza";
      base.tamanho = i.tamanho;
      base.observacao = i.observacao;
      base.sabores = i.sabores.map(function (n) { var s = R.sabor(n); return { numero: s.numero, nome: s.nome, tipo: s.tipo, preco: s.preco[i.tamanho] }; });
      base.borda = b ? { numero: b.numero, nome: b.nome, preco: b.preco } : null;
      base.precoBase = m ? m.base : null;          // maior preço entre os sabores
      base.saborMaisCaro = m ? m.saborMaisCaro : null;
    } else {
      var p = produto(i.chave);
      base.chave = i.chave;
      base.categoria = p.categoria;          // "bebida"
      base.categoriaTitulo = p.categoriaTitulo;
      base.grupo = p.grupo;                  // "Refrigerantes", "Cerveja"...
      base.numero = p.item.numero;
      base.nome = p.item.nome;
    }
    return base;
  }

  /** Resumo de valores. Só soma o que tem preço definido no cardápio. */
  function resumo() {
    var cat = {
      pizzas:  { quantidade: 0, subtotal: 0, aConfirmar: 0 },
      bebidas: { quantidade: 0, subtotal: 0 }
    };
    var bordasNasPizzas = 0, qtdBordas = 0;
    itens.forEach(function (i) {
      var unit = precoUnitario(i);
      var alvo = ehPizza(i) ? cat.pizzas : cat.bebidas;
      alvo.quantidade += i.quantidade;
      if (unit) alvo.subtotal += centavos(unit) * i.quantidade;
      else alvo.aConfirmar += i.quantidade; // segurança: só se faltar preço no cardápio
      if (ehPizza(i) && i.borda) {
        var b = raiz.NM_REGRAS.borda(i.borda);
        if (b) { bordasNasPizzas += centavos(b.preco) * i.quantidade; qtdBordas += i.quantidade; }
      }
    });
    var conhecido = cat.pizzas.subtotal + cat.bebidas.subtotal;
    var porCategoria = {};
    Object.keys(cat).forEach(function (k) {
      porCategoria[k] = { quantidade: cat[k].quantidade, subtotalConhecido: formata(cat[k].subtotal) };
      if ("aConfirmar" in cat[k]) {
        porCategoria[k].aConfirmar = cat[k].aConfirmar;
        porCategoria[k].comPreco = cat[k].quantidade - cat[k].aConfirmar;
      }
    });
    return {
      totalItens: totalItens(),
      totalPizzas: cat.pizzas.quantidade,
      pizzasComPreco: cat.pizzas.quantidade - cat.pizzas.aConfirmar,
      pizzasAConfirmar: cat.pizzas.aConfirmar,
      porCategoria: porCategoria,
      bordasNasPizzas: { quantidade: qtdBordas, valor: formata(bordasNasPizzas) }, // já incluído no subtotal das pizzas
      subtotalConhecido: formata(conhecido),
      totalDefinido: cat.pizzas.aConfirmar === 0 && itens.length > 0
    };
  }

  function somarOuIncluir(novo, extraEvento) {
    var ass = assinatura(novo);
    for (var k = 0; k < itens.length; k++) {
      if (assinatura(itens[k]) === ass) {
        itens[k].quantidade = Math.min(itens[k].quantidade + 1, QTD_MAX);
        avisar("adicionado", { item: copia(itens[k]), agrupado: true });
        if (extraEvento) extraEvento(itens[k]);
        return copia(itens[k]);
      }
    }
    itens.push(novo);
    avisar("adicionado", { item: copia(novo), agrupado: false });
    if (extraEvento) extraEvento(novo);
    return copia(novo);
  }

  /* ---------- API ---------- */
  raiz.NM_SELECAO = {
    /** Adiciona pizza montada (Etapa 4). Pizza idêntica soma quantidade. */
    adicionar: function (dados) {
      var nova = { id: novoId("p"), tipo: "pizza", tamanho: dados.tamanho, sabores: dados.sabores.slice(), borda: dados.borda ? String(dados.borda) : "", observacao: normalizaObs(dados.observacao), quantidade: 1 };
      if (!valido(nova)) return null;
      return somarOuIncluir(nova, function (it) {
        if (raiz.document) raiz.document.dispatchEvent(new CustomEvent("nm:selecao", { detail: { item: copia(it), total: totalPizzas() } }));
      });
    },
    /** Adiciona bebida pela chave ("bebida:cerveja:02"). Mesma chave soma quantidade. Bordas não entram soltas. */
    adicionarProduto: function (chave) {
      if (!produto(chave)) return null;
      return somarOuIncluir({ id: novoId("x"), tipo: "produto", chave: String(chave), quantidade: 1 });
    },
    alterarQuantidade: function (id, delta) {
      var k = acha(id); if (k < 0) return null;
      itens[k].quantidade = Math.min(Math.max(itens[k].quantidade + delta, 1), QTD_MAX);
      avisar("quantidade", { item: copia(itens[k]) });
      return copia(itens[k]);
    },
    /** Remove e devolve { item, posicao } para permitir "Desfazer". */
    remover: function (id) {
      var k = acha(id); if (k < 0) return null;
      var item = itens.splice(k, 1)[0];
      avisar("removido", { item: copia(item) });
      return { item: copia(item), posicao: k };
    },
    restaurar: function (removido) {
      if (!removido || !valido(removido.item) || acha(removido.item.id) > -1) return;
      itens.splice(Math.min(removido.posicao, itens.length), 0, copia(removido.item));
      avisar("restaurado", { item: copia(removido.item) });
    },
    quantidadeDe: function (chave) {
      for (var k = 0; k < itens.length; k++) if (!ehPizza(itens[k]) && itens[k].chave === chave) return itens[k].quantidade;
      return 0;
    },
    produto: produto,
    listar: function () { return itens.map(copia); },
    listarDetalhado: function () { return itens.map(detalhar); },
    quantidade: totalPizzas,
    totalPizzas: totalPizzas,
    totalItens: totalItens,
    resumo: resumo,
    /** Itens + resumo (usado pelo fluxo do pedido). Não envia nada. */
    pedido: function () { return { itens: itens.map(copia), resumo: resumo() }; },
    QTD_MAX: QTD_MAX
  };

  carregar();
})(typeof window !== "undefined" ? window : globalThis);
