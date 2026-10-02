/* =====================================================================
   PIZZARIA NOVO MILÊNIO — DADOS DO PEDIDO: ESTADO E VALIDAÇÃO (Etapa 6)
   Guarda apenas os dados de quem pede. As pizzas continuam vindo do
   carrinho (js/selecao.js) — nada é duplicado aqui.
   Sem envio, sem WhatsApp, sem pagamento, sem taxa/área/tempo de entrega.
   ===================================================================== */
(function (raiz) {
  "use strict";

  var CHAVE = "nm-pedido-dados-v1"; // sessionStorage: some ao fechar a aba (dados pessoais)
  var LIMITES = { nome: 80, whatsapp: 30, endereco: 150, complemento: 80, referencia: 120, observacoes: 300 };
  var VAZIO = { nome: "", whatsapp: "", tipoEntrega: "", endereco: "", complemento: "", referencia: "", observacoes: "" };

  var dados = Object.assign({}, VAZIO);
  var registrado = false;

  function armazenamento() { try { return raiz.sessionStorage; } catch (e) { return null; } }
  function salvar() {
    var s = armazenamento(); if (!s) return;
    try { s.setItem(CHAVE, JSON.stringify({ dados: dados, registrado: registrado })); } catch (e) {}
  }
  function carregar() {
    var s = armazenamento(); if (!s) return;
    try {
      var b = JSON.parse(s.getItem(CHAVE) || "null");
      if (!b || typeof b.dados !== "object") return;
      Object.keys(VAZIO).forEach(function (k) {
        if (typeof b.dados[k] === "string") dados[k] = b.dados[k].slice(0, LIMITES[k] || 20);
      });
      if (dados.tipoEntrega !== "delivery" && dados.tipoEntrega !== "retirada") dados.tipoEntrega = "";
      registrado = !!b.registrado;
    } catch (e) {}
  }

  /** Só dígitos; aceita +55, 0 antes do DDD, parênteses, espaços e hífens. */
  function digitosWhatsapp(texto) {
    var d = String(texto || "").replace(/\D/g, "");
    if ((d.length === 12 || d.length === 13) && d.indexOf("55") === 0) d = d.slice(2);
    while (d.length > 11 && d.charAt(0) === "0") d = d.slice(1);
    if (d.length === 12 && d.charAt(0) === "0") d = d.slice(1);
    return d;
  }
  /** Válido quando tem DDD + número: 10 dígitos (fixo) ou 11 (celular). */
  function whatsappValido(texto) {
    var d = digitosWhatsapp(texto);
    return d.length === 10 || d.length === 11;
  }

  /** Validação mínima pedida: nome, WhatsApp, forma de receber e endereço (só Delivery). */
  function validar(d) {
    d = d || dados;
    var erros = {};
    if (d.tipoEntrega !== "delivery" && d.tipoEntrega !== "retirada") erros.tipoEntrega = "Escolha como você vai receber: Delivery ou Retirada.";
    if (!String(d.nome).trim()) erros.nome = "Informe seu nome.";
    if (!String(d.whatsapp).trim()) erros.whatsapp = "Informe seu WhatsApp.";
    else if (!whatsappValido(d.whatsapp)) erros.whatsapp = "Confira o número: informe com DDD, por exemplo (11) 91234-5678.";
    if (d.tipoEntrega === "delivery" && !String(d.endereco).trim()) erros.endereco = "Informe o endereço de entrega (rua, avenida e número).";
    return { valido: Object.keys(erros).length === 0, erros: erros };
  }

  function limpo(t) { return String(t || "").replace(/\s+/g, " ").trim(); }

  raiz.NM_PEDIDO = {
    LIMITES: LIMITES,
    dados: function () { return Object.assign({}, dados); },
    /** Atualiza campos (texto livre, sem interpretação). Qualquer mudança desfaz o "registrado". */
    atualizar: function (parcial) {
      Object.keys(parcial || {}).forEach(function (k) {
        if (!(k in VAZIO)) return;
        var v = String(parcial[k] == null ? "" : parcial[k]);
        dados[k] = LIMITES[k] ? v.slice(0, LIMITES[k]) : v;
      });
      registrado = false;
      salvar();
    },
    validar: validar,
    whatsappValido: whatsappValido,
    digitosWhatsapp: digitosWhatsapp,
    /** Marca os dados como conferidos (não envia nada). Retorna o pedido ou null se inválido. */
    registrar: function () {
      if (!validar().valido) return null;
      registrado = true;
      salvar();
      return this.obter();
    },
    estaRegistrado: function () { return registrado; },
    /**
     * Pedido atual para a Etapa 7:
     * { carrinho: { itens, resumo }, dadosCliente: {...}, localRetirada, registrado }
     * Na Retirada, campos de entrega saem vazios (os digitados ficam guardados
     * caso a pessoa volte para Delivery).
     */
    obter: function () {
      var CFG = raiz.NM_CONFIG, retirada = dados.tipoEntrega === "retirada";
      var e = CFG ? CFG.empresa.endereco : null;
      return {
        carrinho: raiz.NM_SELECAO ? raiz.NM_SELECAO.pedido() : { itens: [], resumo: null },
        dadosCliente: {
          nome: limpo(dados.nome),
          whatsapp: limpo(dados.whatsapp),
          tipoEntrega: dados.tipoEntrega,
          endereco: retirada ? "" : limpo(dados.endereco),
          complemento: retirada ? "" : limpo(dados.complemento),
          referencia: retirada ? "" : limpo(dados.referencia),
          observacoes: String(dados.observacoes || "").trim()
        },
        localRetirada: retirada && e ? [e.linha1, e.bairro, e.cidade, e.cep].join(" – ") : null,
        registrado: registrado
      };
    }
  };

  carregar();
})(typeof window !== "undefined" ? window : globalThis);
