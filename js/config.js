/* =====================================================================
   PIZZARIA NOVO MILÊNIO — CONFIGURAÇÃO CENTRAL
   Dados oficiais da empresa e regras de negócio.
   Fica separado da lista de produtos (js/cardapio-dados.js).
   ===================================================================== */
window.NM_CONFIG = {
  empresa: {
    nome: "Pizzaria Novo Milênio",
    endereco: {
      linha1: "R. Paim, 211 – Loja 19",
      bairro: "Bela Vista",
      cidade: "São Paulo – SP",
      cep: "01306-010",
      consultaMapa: "R. Paim, 211 - Bela Vista, São Paulo - SP, 01306-010"
    },
    whatsapp: {
      exibicao: "(11) 96224-8186",
      link: "https://wa.me/5511962248186"
    },
    // DDD dos fixos ainda não confirmado (presumido 11 apenas no link de discagem)
    telefones: [
      { exibicao: "3159-5191", link: "tel:+551131595191" },
      { exibicao: "3151-5502", link: "tel:+551131515502" }
    ],
    instagram: {
      usuario: "@pizzaria_novomilenio",
      link: "https://www.instagram.com/pizzaria_novomilenio/"
    },
    servicos: ["Delivery", "Retirada"]
  },

  /* Horário oficial: todos os dias, 18:00 à 01:00 (encerra à 01:00).
     Não há horários diferentes por dia. Nesta etapa não existe lógica de
     aberto/fechado — o dado fica aqui para ser reutilizado depois. */
  horario: {
    todosOsDias: true,
    abre: "18:00",
    fecha: "01:00",
    exibicao: "Todos os dias, das 18:00 à 01:00"
  },

  /* Regras oficiais de sabores por tamanho — usadas pela montagem (js/montagem-regras.js). */
  tamanhos: {
    grande: {
      rotulo: "Grande",
      maxSabores: 3,
      permiteMisturarSalgadaEDoce: true
    },
    broto: {
      rotulo: "Broto",
      maxSabores: 2,
      permiteMisturarSalgadaEDoce: false
    }
  },

  /* Preço de pizza com 2 ou 3 sabores — CONFIRMADO pela pizzaria:
     o preço da pizza é o MAIOR preço entre os sabores escolhidos,
     no tamanho escolhido (Grande ou Broto).
     Não é média, soma, divisão nem cobrança proporcional. */
  regraPrecoMultiplosSabores: "maior-preco",

  /* Borda recheada: escolhida dentro da montagem e vinculada à pizza.
     O preço da borda (do cardápio) é somado ao preço da pizza. */
  borda: { somaAoPrecoDaPizza: true }
};
