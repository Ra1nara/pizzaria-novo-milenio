/* =====================================================================
   PIZZARIA NOVO MILÊNIO — DADOS DO CARDÁPIO (fonte única)
   Transcrito das imagens originais em assets/ (cardapio (1), (2), (3)).

   REGRAS:
   - Nomes, descrições, numeração e preços exatamente como no cardápio.
   - Nenhuma grafia corrigida. Nada resumido, inventado ou reordenado.
   - Preços guardados como texto, no formato do cardápio ("51,90").
   - "pendente" = observação interna para confirmar com a pizzaria.
     Não aparece no site e não altera o dado.
   ===================================================================== */
window.NM_CARDAPIO = {

  pizzas: [
    /* ---------------- PIZZAS SALGADAS (01–48) ---------------- */
    { numero: "01", nome: "ABOBRINHA", descricao: "Mussarela, Abobrinha e Alho", tipo: "salgada", preco: { grande: "51,90", broto: "36,90" } },
    { numero: "02", nome: "ALHO", descricao: "Molho de Tomate, Alho e Mussarela", tipo: "salgada", preco: { grande: "51,90", broto: "36,90" } },
    { numero: "03", nome: "ALICHE COM MUSSARELA", descricao: "Aliche, Rodelas de Tomate e Mussarela", tipo: "salgada", preco: { grande: "51,90", broto: "36,90" } },
    { numero: "04", nome: "ALICHE", descricao: "Molho de Tomate, Aliche, Alho Frito e Permesão", tipo: "salgada", preco: { grande: "51,90", broto: "36,90" },
      pendente: "Grafia 'Permesão' mantida como no cardápio." },
    { numero: "05", nome: "A MODA DA CASA", descricao: "Frango Champigon, Molho, Catupiry e Milho", tipo: "salgada", preco: { grande: "61,90", broto: "41,90" },
      pendente: "Grafia 'Champigon' mantida como no cardápio." },
    { numero: "06", nome: "A MODA DO CHEFE", descricao: "Provolone, Presunto, Tomate e Parmesão", tipo: "salgada", preco: { grande: "51,90", broto: "36,90" } },
    { numero: "07", nome: "ATUM", descricao: "Atum coberto com Cebolas", tipo: "salgada", preco: { grande: "56,90", broto: "39,90" } },
    { numero: "08", nome: "ATUM SÓLIDO ESPECIAL", descricao: "Atum, Mussarela, Cebola e Tomate", tipo: "salgada", preco: { grande: "61,90", broto: "41,90" } },
    { numero: "09", nome: "BACON", descricao: "Mussarela, Bancon e Cebola", tipo: "salgada", preco: { grande: "51,90", broto: "36,90" },
      pendente: "Grafia 'Bancon' mantida como no cardápio." },
    { numero: "10", nome: "BAIANA", descricao: "Calabresa Moida, Pimenta, Ovos e Cebola", tipo: "salgada", preco: { grande: "51,90", broto: "36,90" },
      pendente: "Grafia 'Moida' (sem acento) mantida como no cardápio." },
    { numero: "11", nome: "BATATA PALHA", descricao: "Mussarela e Batata Palha", tipo: "salgada", preco: { grande: "51,90", broto: "36,90" } },
    { numero: "12", nome: "BAURU", descricao: "Presunto, Mussarela e Tomate", tipo: "salgada", preco: { grande: "43,90", broto: "31,90" } },
    { numero: "13", nome: "BRÓCOLIS", descricao: "Brócolis Temperado e Mussarela", tipo: "salgada", preco: { grande: "51,90", broto: "36,90" } },
    { numero: "14", nome: "CAIPIRA", descricao: "Frango.Mussarela e Milho", tipo: "salgada", preco: { grande: "53,90", broto: "41,90" },
      pendente: "Separador entre 'Frango' e 'Mussarela' aparece como ponto no cardápio; mantido." },
    { numero: "15", nome: "CALABRESA", descricao: "Calabresa coberta com Cebola", tipo: "salgada", preco: { grande: "43,90", broto: "31,90" } },
    { numero: "16", nome: "CALZONE NOVO MILÊNIO", descricao: "Lombo Canadense, Ovo, Palmito e Mussarela", tipo: "salgada", preco: { grande: "51,90", broto: "36,90" } },
    { numero: "17", nome: "CAMARÃO COM CATUPIRY", descricao: "Camarão com Catupiry ou Mussarela", tipo: "salgada", preco: { grande: "101,90", broto: "80,90" },
      pendente: "Opção 'ou': confirmar se a escolha não altera o preço." },
    { numero: "18", nome: "CARNE DE SOL", descricao: "Carne de Sol, Mussarela, Cebola e Brócolis", tipo: "salgada", preco: { grande: "56,90", broto: "36,90" },
      pendente: "Conferir preço Broto (R$ 36,90) com a pizzaria." },
    { numero: "19", nome: "CINCO QUEIJOS", descricao: "Mussarela, Gorgonzola, Catupiry, Provolone e Parmesão", tipo: "salgada", preco: { grande: "61,90", broto: "41,90" } },
    { numero: "20", nome: "COSTELA", descricao: "Molho de tomate, Mussarela, Costela desfiada e Cebola", tipo: "salgada", preco: { grande: "56,90", broto: "42,90" } },
    { numero: "21", nome: "COSTELA ESPECIAL", descricao: "Molho de tomate, Mussarela, Costela desfiada, Cebola e Caturpiry", tipo: "salgada", preco: { grande: "61,90", broto: "46,90" },
      pendente: "Grafia 'Caturpiry' mantida como no cardápio." },
    { numero: "22", nome: "ESCAROLA", descricao: "Escarola tempera coberta com Mussarela", tipo: "salgada", preco: { grande: "43,90", broto: "31,90" },
      pendente: "Grafia 'tempera' mantida como no cardápio." },
    { numero: "23", nome: "FRANGO ESPECIAL", descricao: "Frango e Catupiry Original", tipo: "salgada", preco: { grande: "61,90", broto: "46,90" } },
    { numero: "24", nome: "GORGONZOLA", descricao: "Queijo Gorgonzola", tipo: "salgada", preco: { grande: "51,90", broto: "36,90" } },
    { numero: "25", nome: "LARICA", descricao: "Frango, Catupiry, Presunto, Mussarela e Calabresa", tipo: "salgada", preco: { grande: "61,90", broto: "46,90" },
      pendente: "Preço Broto R$ 46,90 está escrito à mão sobre o original; confirmar." },
    { numero: "26", nome: "LOMBO", descricao: "Lombo Canadense coberto com Catupiry ou Mussarela", tipo: "salgada", preco: { grande: "51,90", broto: "36,90" },
      pendente: "Opção 'ou': confirmar se a escolha não altera o preço." },
    { numero: "27", nome: "MUSSARELA", descricao: "Molho de Tomate e Mussarela", tipo: "salgada", preco: { grande: "43,90", broto: "31,90" } },
    { numero: "28", nome: "MARGUERITA", descricao: "Mussarela, Tomate, Manjericão fresco e Parmesão", tipo: "salgada", preco: { grande: "51,90", broto: "39,90" },
      pendente: "Conferir preço Broto (R$ 39,90). Leitura de 'Manjericão' feita em imagem de baixa resolução." },
    { numero: "29", nome: "MILHO VERDE", descricao: "Milho Verde coberto com Mussarela ou Catupiry", tipo: "salgada", preco: { grande: "43,90", broto: "31,90" },
      pendente: "Opção 'ou': confirmar se a escolha não altera o preço." },
    { numero: "30", nome: "NAPOLITANA", descricao: "Mussarela, Tomate e Parmesão", tipo: "salgada", preco: { grande: "51,90", broto: "36,90" } },
    { numero: "31", nome: "PALMITO", descricao: "Palmito coberto com Mussarela", tipo: "salgada", preco: { grande: "51,90", broto: "36,90" } },
    { numero: "32", nome: "PEITO DE PERU", descricao: "Peito de Peru com Mussarela", tipo: "salgada", preco: { grande: "51,90", broto: "36,90" } },
    { numero: "33", nome: "PEPPERONI", descricao: "Mussarela, Pepperoni e Cebola", tipo: "salgada", preco: { grande: "51,90", broto: "36,90" } },
    { numero: "34", nome: "PAIM", descricao: "Frango, Escarola e Palmito", tipo: "salgada", preco: { grande: "51,90", broto: "36,90" } },
    { numero: "35", nome: "PERUANA", descricao: "Atum coberto com Mussarela ou Catupiry", tipo: "salgada", preco: { grande: "61,90", broto: "43,90" },
      pendente: "Opção 'ou': confirmar se a escolha não altera o preço." },
    { numero: "36", nome: "PIZZA LIGHT", descricao: "Queijo branco , Rúcula, Peito de Peru e Tomate Seco", tipo: "salgada", preco: { grande: "61,90", broto: "43,90" },
      pendente: "Espaço antes da vírgula mantido como no cardápio." },
    { numero: "37", nome: "PORTUGUESA", descricao: "Mussarela, Presunto, Ovo e Cebola", tipo: "salgada", preco: { grande: "51,90", broto: "41,90" },
      pendente: "Conferir preço Broto (R$ 41,90) com a pizzaria." },
    { numero: "38", nome: "PORTUGUESA COM CATUPIRY", descricao: "Mussarela, Presunto,Ovo e Catupiry", tipo: "salgada", preco: { grande: "61,90", broto: "43,90" } },
    { numero: "39", nome: "PORTUGUESA ESPECIAL", descricao: "Mussarela, Presunto, Palmito, Bacon, Ovos e Cebola", tipo: "salgada", preco: { grande: "61,90", broto: "43,90" } },
    { numero: "40", nome: "PROVOLONE", descricao: "Molho de Tomate e Provolone", tipo: "salgada", preco: { grande: "51,90", broto: "41,90" },
      pendente: "Conferir preço Broto (R$ 41,90) com a pizzaria." },
    { numero: "41", nome: "QUATRO QUEIJOS", descricao: "Mussarela, Catupiry, Provolone e Parmesão", tipo: "salgada", preco: { grande: "56,90", broto: "41,90" },
      pendente: "Conferir preço Broto (R$ 41,90) com a pizzaria." },
    { numero: "42", nome: "ROMANA", descricao: "Mussarela, Aliche, Alho e Cebola", tipo: "salgada", preco: { grande: "51,90", broto: "36,90" } },
    { numero: "43", nome: "RÚCULA", descricao: "Mussarela, Tomate Seco e Rúcula", tipo: "salgada", preco: { grande: "56,90", broto: "43,90" } },
    { numero: "44", nome: "SÃO JORGE", descricao: "Presunto,Palmito, Ovos e Mussarela", tipo: "salgada", preco: { grande: "51,90", broto: "36,90" } },
    { numero: "45", nome: "SICILIANA", descricao: "Champignon, Bacon e Mussarela", tipo: "salgada", preco: { grande: "51,90", broto: "36,90" } },
    { numero: "46", nome: "TOSCANA", descricao: "Mussarela, Calabresa e Cebola", tipo: "salgada", preco: { grande: "51,90", broto: "36,90" } },
    { numero: "47", nome: "VEGETARIANA", descricao: "Palmito Brocólis e Tomate", tipo: "salgada", preco: { grande: "51,90", broto: "36,90" },
      pendente: "Grafia 'Brocólis' e ausência de vírgula mantidas como no cardápio." },
    { numero: "48", nome: "VIAGRA", descricao: "Mussarela, Champignon, Ovos de Codoma e Manjericão", tipo: "salgada", preco: { grande: "51,90", broto: "36,90" },
      pendente: "Grafia 'Codoma' mantida como no cardápio (imagem de baixa resolução). Confirmar exibição do nome." },

    /* ---------------- PIZZAS DOCES (49–55) ---------------- */
    { numero: "49", nome: "BANANA COM CANELA", descricao: "Banana, Canela e Leite Condensado", tipo: "doce", preco: { grande: "51,90", broto: "36,90" } },
    { numero: "50", nome: "BRIGADEIRO", descricao: "Chocolate com Granulado", tipo: "doce", preco: { grande: "51,90", broto: "36,90" } },
    { numero: "51", nome: "MINEIRA", descricao: "Queijo Branco e Doce de Leite", tipo: "doce", preco: { grande: "51,90", broto: "36,90" } },
    { numero: "52", nome: "PRESTÍGIO", descricao: "Chocolate e Coco Ralado", tipo: "doce", preco: { grande: "51,90", broto: "36,90" } },
    { numero: "53", nome: "ROMEU E JULIETA", descricao: "Queijo Branco e Goiabada", tipo: "doce", preco: { grande: "51,90", broto: "36,90" } },
    { numero: "54", nome: "CHOCOLATE COM MORANGO", descricao: "Chocolate e Morango", tipo: "doce", preco: { grande: "56,90", broto: "36,90" },
      pendente: "Conferir preço Broto (R$ 36,90) com a pizzaria." },
    { numero: "55", nome: "CHOCOLATE COM MM'S", descricao: "Chocolate e MM's", tipo: "doce", preco: { grande: "61,90", broto: "46,90" },
      pendente: "Preço Broto R$ 46,90 está escrito à mão sobre o original; confirmar." }
  ],

  /* ---------------- BORDAS RECHEADAS ---------------- */
  bordas: {
    titulo: "Borda recheada",
    pendente: "Confirmar se o valor é o mesmo na Grande e na Broto e se vale para pizzas de mais de um sabor.",
    itens: [
      { numero: "01", nome: "CATUPIRY ORIGINAL", preco: "15,00" },
      { numero: "02", nome: "CHOCOLATE", preco: "15,00" },
      { numero: "03", nome: "MUSSARELA", preco: "15,00" }
    ]
  },

  /* ---------------- BEBIDAS ----------------
     Ordem dos grupos conforme o documento de contexto.
     Títulos e grafias conforme as imagens do cardápio. */
  bebidas: [
    { id: "refrigerantes", titulo: "Refrigerantes", itens: [
      { numero: "01", nome: "COCA COLA ZERO 2LT", preco: "16,00" },
      { numero: "02", nome: "GUARANÁ 2 LITROS", preco: "14,00" },
      { numero: "03", nome: "SPRITE 2 LITROS", preco: "14,00" },
      { numero: "04", nome: "FANTA 2 LITROS", preco: "14,00", pendente: "Um dígito do preço parece retocado na imagem; lido como R$ 14,00." },
      { numero: "05", nome: "COCA COLA 2 LITROS", preco: "15,00" },
      { numero: "06", nome: "GUARANÁ LATA", preco: "7,00" },
      { numero: "07", nome: "SPRITE LATA", preco: "7,00" },
      { numero: "08", nome: "FANTA LATA", preco: "7,00" },
      { numero: "09", nome: "COCA LATA", preco: "7,00" },
      { numero: "10", nome: "GUARANÁ 600ML", preco: "11,00" },
      { numero: "11", nome: "COCA 600ML", preco: "11,00" },
      { numero: "12", nome: "ÁGUA 500ML", preco: "4,00" },
      { numero: "13", nome: "SUCO DEL VALE 1LT", preco: "13,00", pendente: "Grafia 'DEL VALE'; item também próximo da categoria Suco Natural." },
      { numero: "14", nome: "GUARANÁ 1LT", preco: "12,00" }
    ]},
    { id: "suco-natural", titulo: "Suco natural", pendente: "Confirmar o nome da categoria para itens Del Valle.", itens: [
      { numero: "01", nome: "SUCO DEL VALE UVA 1L", preco: "13,00" },
      { numero: "02", nome: "SUCO DEL VALE CAJU 1L", preco: "13,00" },
      { numero: "03", nome: "SUCO DEL VALE LARANJA 1L", preco: "13,00" }
    ]},
    { id: "cerveja", titulo: "Cerveja", itens: [
      { numero: "01", nome: "HEINEKEN 330ML", preco: "12,00" },
      { numero: "02", nome: "STELA 275ML", preco: "12,00", pendente: "Grafia 'STELA' mantida como no cardápio." },
      { numero: "03", nome: "BUDWEISER 330ML", preco: "12,00" },
      { numero: "04", nome: "CORONA 330ML", preco: "12,00" }
    ]},
    { id: "cachaca", titulo: "Cachaça", itens: [
      { numero: "01", nome: "SERRA LIMPA", preco: "50,00" },
      { numero: "02", nome: "RAINHA 350ML", preco: "25,00" },
      { numero: "03", nome: "RAINHA 600ML", preco: "45,00" },
      { numero: "04", nome: "COBIÇADA", preco: "25,00" },
      { numero: "05", nome: "MATUTA", preco: "25,00" }
    ]}
  ]
};
