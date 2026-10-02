/* =====================================================================
   PIZZARIA NOVO MILÊNIO — REGRAS DA MONTAGEM DA PIZZA (Etapa 4)
   Funções puras, sem interface. Usam:
   - NM_CONFIG.tamanhos (limites e mistura salgada/doce)
   - NM_CONFIG.regraPrecoMultiplosSabores ("maior-preco": confirmado pela pizzaria)
   - NM_CARDAPIO.pizzas (fonte única dos sabores — não é alterada)
   ===================================================================== */
(function (raiz) {
  "use strict";

  function dados() { return raiz.NM_CARDAPIO; }
  function config() { return raiz.NM_CONFIG; }

  function sabor(numero) {
    var n = String(numero).padStart(2, "0");
    var lista = dados().pizzas;
    for (var i = 0; i < lista.length; i++) if (lista[i].numero === n) return lista[i];
    return null;
  }

  function regra(tamanho) {
    var r = config().tamanhos[tamanho];
    if (!r) throw new Error("Tamanho desconhecido: " + tamanho);
    return r;
  }

  /** Tipo já definido pela seleção (ou null se vazia). */
  function tipoDaSelecao(numeros) {
    return numeros.length ? sabor(numeros[0]).tipo : null;
  }

  /**
   * Pode adicionar o sabor `novo` à seleção atual neste tamanho?
   * Retorna { ok: true } ou { ok: false, motivo: "limite" | "tipo" | "repetido" | "inexistente" }.
   */
  function podeAdicionar(tamanho, numeros, novo) {
    var r = regra(tamanho), s = sabor(novo);
    if (!s) return { ok: false, motivo: "inexistente" };
    if (numeros.indexOf(s.numero) > -1) return { ok: false, motivo: "repetido" };
    if (numeros.length >= r.maxSabores) return { ok: false, motivo: "limite" };
    if (!r.permiteMisturarSalgadaEDoce) {
      var tipo = tipoDaSelecao(numeros);
      if (tipo && tipo !== s.tipo) return { ok: false, motivo: "tipo", tipoPermitido: tipo };
    }
    return { ok: true };
  }

  /**
   * Valida uma montagem completa.
   * Retorna { valida: bool, problemas: [ { codigo, ... } ] }.
   */
  function validar(tamanho, numeros) {
    var problemas = [];
    if (!tamanho || !config().tamanhos[tamanho]) {
      problemas.push({ codigo: "sem-tamanho" });
      return { valida: false, problemas: problemas };
    }
    var r = regra(tamanho);
    if (!numeros.length) problemas.push({ codigo: "sem-sabor" });
    if (numeros.length > r.maxSabores) problemas.push({ codigo: "excesso", max: r.maxSabores, atual: numeros.length });
    if (!r.permiteMisturarSalgadaEDoce) {
      var tipos = {};
      numeros.forEach(function (n) { var s = sabor(n); if (s) tipos[s.tipo] = true; });
      if (Object.keys(tipos).length > 1) problemas.push({ codigo: "mistura" });
    }
    numeros.forEach(function (n) { if (!sabor(n)) problemas.push({ codigo: "inexistente", numero: n }); });
    return { valida: problemas.length === 0, problemas: problemas };
  }

  /* ---------- Preço ---------- */
  function centavos(texto) { return Math.round(parseFloat(String(texto).replace(/\./g, "").replace(",", ".")) * 100); }
  function formata(c) {
    var reais = Math.floor(c / 100), cent = String(c % 100).padStart(2, "0");
    return String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + cent;
  }

  /**
   * Preço base da pizza (texto do cardápio, ex. "61,90") ou null.
   * Regra confirmada pela pizzaria (NM_CONFIG.regraPrecoMultiplosSabores = "maior-preco"):
   * o preço é o MAIOR preço, no tamanho escolhido, entre os sabores selecionados.
   * Com 1 sabor, é o próprio preço do sabor.
   */
  function precoConhecido(tamanho, numeros) {
    if (!tamanho || !numeros || numeros.length === 0) return null;
    var maior = null;
    for (var i = 0; i < numeros.length; i++) {
      var s = sabor(numeros[i]);
      if (!s || !s.preco[tamanho]) return null;
      if (numeros.length > 1 && config().regraPrecoMultiplosSabores !== "maior-preco") return null;
      if (maior === null || centavos(s.preco[tamanho]) > centavos(maior)) maior = s.preco[tamanho];
    }
    return maior;
  }

  /** Borda do cardápio pelo número ("01"), ou null. "" / null = sem borda. */
  function borda(numero) {
    if (!numero) return null;
    var n = String(numero).padStart(2, "0"), lista = dados().bordas.itens;
    for (var i = 0; i < lista.length; i++) if (lista[i].numero === n) return lista[i];
    return null;
  }

  /**
   * Preço da pizza montada:
   *   total = maior preço entre os sabores (tamanho escolhido) + preço da borda (se houver)
   * Retorna { base, borda, total, saborMaisCaro } com valores em texto ("70,00") ou null.
   */
  function precoMontado(tamanho, numeros, numeroBorda) {
    var base = precoConhecido(tamanho, numeros);
    if (!base) return null;
    var b = borda(numeroBorda);
    var maisCaro = null;
    numeros.forEach(function (n) { var s = sabor(n); if (s.preco[tamanho] === base && !maisCaro) maisCaro = s.numero; });
    return {
      base: base,
      borda: b ? b.preco : null,
      total: formata(centavos(base) + (b ? centavos(b.preco) : 0)),
      saborMaisCaro: maisCaro
    };
  }

  raiz.NM_REGRAS = {
    sabor: sabor,
    tipoDaSelecao: tipoDaSelecao,
    podeAdicionar: podeAdicionar,
    validar: validar,
    precoConhecido: precoConhecido,
    borda: borda,
    precoMontado: precoMontado,
    centavos: centavos,
    formata: formata
  };
})(typeof window !== "undefined" ? window : globalThis);
