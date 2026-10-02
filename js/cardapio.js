/* =====================================================================
   PIZZARIA NOVO MILÊNIO — INTERFACE DO CARDÁPIO
   Lê os dados de js/cardapio-dados.js e a configuração de js/config.js.
   Responsável por: listar categorias, busca (número, nome, descrição)
   e barra de pedido no celular.
   Não contém montagem de pizza, carrinho, pedido ou cálculo de preço.
   ===================================================================== */
(function () {
  "use strict";

  var CFG = window.NM_CONFIG;
  var DADOS = window.NM_CARDAPIO;
  if (!CFG || !DADOS) return;

  /* ---------- Acesso aos dados (reutilizável nas próximas etapas) ---------- */
  var pizzas = DADOS.pizzas;
  var porNumero = {};
  pizzas.forEach(function (p) { porNumero[p.numero] = p; });

  window.NM = {
    config: CFG,
    cardapio: DADOS,
    /** Retorna o sabor pelo número ("01"–"55"), ou null. */
    sabor: function (numero) {
      var n = String(numero).padStart(2, "0");
      return porNumero[n] || null;
    },
    /** Lista os sabores de um tipo: "salgada" ou "doce". */
    saboresPorTipo: function (tipo) {
      return pizzas.filter(function (p) { return p.tipo === tipo; });
    }
  };

  /* ---------- Categorias da interface ---------- */
  var CATEGORIAS = {
    salgadas: { titulo: "Pizzas salgadas", sub: "01 a 48" },
    doces:    { titulo: "Pizzas doces",    sub: "49 a 55" },
    bordas:   { titulo: DADOS.bordas.titulo, sub: DADOS.bordas.itens.length + " opções" },
    bebidas:  { titulo: "Bebidas", sub: "" }
  };

  /* ---------- Utilidades ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function norm(s) {
    return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }
  // Destaca os termos buscados preservando acentos e grafia originais
  function realce(texto, termos) {
    if (!termos.length) return esc(texto);
    var mapa = [], n = "";
    for (var i = 0; i < texto.length; i++) {
      var c = norm(texto[i]);
      for (var k = 0; k < c.length; k++) { n += c[k]; mapa.push(i); }
    }
    var marcado = new Array(texto.length).fill(false);
    termos.forEach(function (t) {
      var p = n.indexOf(t);
      while (p > -1) {
        for (var j = p; j < p + t.length; j++) marcado[mapa[j]] = true;
        p = n.indexOf(t, p + t.length);
      }
    });
    var out = "", aberto = false;
    for (var x = 0; x < texto.length; x++) {
      if (marcado[x] && !aberto) { out += "<mark>"; aberto = true; }
      if (!marcado[x] && aberto) { out += "</mark>"; aberto = false; }
      out += esc(texto[x]);
    }
    return out + (aberto ? "</mark>" : "");
  }

  /* ---------- Componentes ---------- */
  function htmlPizza(p, termos, numeroMarcado) {
    return '<li class="pizza" id="sabor-' + p.numero + '" data-numero="' + p.numero + '" data-tipo="' + p.tipo + '">' +
      '<span class="pizza-n">' + (numeroMarcado ? "<mark>" + p.numero + "</mark>" : p.numero) + "</span>" +
      '<div class="pizza-txt"><h4 class="pizza-nome">' + realce(p.nome, termos) + "</h4>" +
      '<p class="pizza-desc">' + realce(p.descricao, termos) + "</p></div>" +
      '<div class="precos">' +
        '<span class="preco g"><small>' + CFG.tamanhos.grande.rotulo + '</small><strong><span class="rs">R$</span>' + p.preco.grande + "</strong></span>" +
        '<span class="preco b"><small>' + CFG.tamanhos.broto.rotulo + '</small><strong><span class="rs">R$</span>' + p.preco.broto + "</strong></span>" +
        '<button type="button" class="btn-escolher" data-escolher="' + p.numero + '" aria-label="Escolher pizza ' + p.numero + " — " + esc(p.nome) + '">Escolher</button>' +
      "</div></li>";
  }
  /* chave = referência da bebida para o carrinho ("bebida:refrigerantes:05").
     Bordas são só consulta (sem chave): a borda é escolhida na montagem da pizza. */
  function htmlSimples(item, termos, grupo, chave) {
    return '<li class="simples"><span class="pizza-n">' + item.numero + "</span>" +
      '<span class="simples-nome">' + realce(item.nome, termos) + (grupo ? "<small>" + esc(grupo) + "</small>" : "") + "</span>" +
      '<span class="simples-val"><span class="rs">R$</span>' + item.preco + "</span>" +
      (chave ? '<button type="button" class="btn-escolher btn-adicionar" data-adicionar-produto="' + chave + '" aria-label="Adicionar ao carrinho: ' + esc(item.nome) + '">Adicionar</button>' : "") +
      "</li>";
  }
  function htmlCabecalho(titulo, sub) {
    return '<div class="lista-cab"><h3>' + esc(titulo) + "</h3>" + (sub ? "<span>" + esc(sub) + "</span>" : "") + "</div>";
  }

  /* ---------- Elementos ---------- */
  var lista = document.getElementById("lista");
  var status = document.querySelector(".status");
  var campo = document.getElementById("q");
  var caixa = campo.parentNode;
  var botoesCat = Array.prototype.slice.call(document.querySelectorAll(".cat"));
  var categoriaAtual = "salgadas";

  function mostrarCategoria(cat) {
    var c = CATEGORIAS[cat], h = htmlCabecalho(c.titulo, c.sub);
    if (cat === "salgadas" || cat === "doces") {
      var tipo = cat === "salgadas" ? "salgada" : "doce";
      h += "<ul>" + window.NM.saboresPorTipo(tipo).map(function (p) { return htmlPizza(p, []); }).join("") + "</ul>";
    } else if (cat === "bordas") {
      h += '<p class="aviso-borda">A borda é escolhida dentro da montagem da pizza: toque em “Escolher” em um sabor e selecione a borda. O valor da borda é somado ao preço da pizza.</p>';
      h += "<ul>" + DADOS.bordas.itens.map(function (i) { return htmlSimples(i, []); }).join("") + "</ul>";
    } else if (cat === "bebidas") {
      h += DADOS.bebidas.map(function (g) {
        return '<p class="subgrupo">' + esc(g.titulo) + "</p><ul>" + g.itens.map(function (i) { return htmlSimples(i, [], null, "bebida:" + g.id + ":" + i.numero); }).join("") + "</ul>";
      }).join("");
    }
    lista.innerHTML = h;
    status.textContent = "";
  }

  function marcarCategoria(cat) {
    botoesCat.forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.cat === cat ? "true" : "false"); });
  }

  /* Núcleo da busca de sabores — reutilizado pela montagem (Etapa 4).
     Retorna { modo: "numero" | "texto" | "vazio", pizzas: [...], termos: [...], digitos } */
  function buscarPizzas(valor) {
    var t = String(valor).trim();
    if (!t) return { modo: "vazio", pizzas: [], termos: [] };
    var num = t.match(/^(?:n[º°o.]?\s*)?(\d{1,2})$/i);
    if (num) {
      var d = num[1], alvo = d.padStart(2, "0");
      var exato = porNumero[alvo] ? [porNumero[alvo]] : [];
      var outros = d.length === 1 ? pizzas.filter(function (p) { return p.numero !== alvo && p.numero.charAt(0) === d; }) : [];
      return { modo: "numero", pizzas: exato.concat(outros), termos: [], digitos: d, exato: exato.length > 0, soExato: exato.length > 0 && !outros.length, alvo: alvo };
    }
    var termos = norm(t).split(/\s+/).filter(Boolean);
    var achados = pizzas.filter(function (p) { return contemTermos(p.nome + " " + p.descricao, termos); });
    return { modo: "texto", termos: termos, pizzas: ordenarPorRelevancia(achados, termos) };
  }
  /* Ordem dos resultados de texto (não altera os dados nem remove resultados):
     0 = nome igual ao termo buscado ("alho" → ALHO)
     1 = todos os termos no nome do sabor
     2 = algum termo no nome do sabor
     3 = encontrado só na descrição/ingredientes
     Empate: mantém a ordem original do cardápio (01 → 55). */
  function ordenarPorRelevancia(lista, termos) {
    var busca = termos.join(" ");
    function nivel(p) {
      var nome = norm(p.nome).replace(/\s+/g, " ").trim();
      if (nome === busca) return 0;
      if (termos.every(function (x) { return nome.indexOf(x) > -1; })) return 1;
      if (termos.some(function (x) { return nome.indexOf(x) > -1; })) return 2;
      return 3;
    }
    return lista.map(function (p, i) { return { p: p, n: nivel(p), i: i }; })
      .sort(function (a, b) { return a.n - b.n || a.i - b.i; })
      .map(function (x) { return x.p; });
  }
  function contemTermos(s, termos) { var n = norm(s); return termos.every(function (x) { return n.indexOf(x) > -1; }); }
  window.NM.buscarPizzas = buscarPizzas;
  window.NM.realce = realce;
  window.NM.esc = esc;

  /* Busca: número (ex.: 33, nº 33), nome ou termo da descrição */
  function buscar(valor) {
    var t = valor.trim();
    if (!t) { mostrarCategoria(categoriaAtual); marcarCategoria(categoriaAtual); return; }
    marcarCategoria(null);

    var html = "", total = 0;
    var r = buscarPizzas(t);

    if (r.modo === "numero") {
      total = r.pizzas.length;
      if (total) html = htmlCabecalho(r.soExato ? "Sabor nº " + r.alvo : "Sabores com nº " + r.digitos, "") +
        "<ul>" + r.pizzas.map(function (p) { return htmlPizza(p, [], true); }).join("") + "</ul>";
    } else {
      var termos = r.termos;
      var bate = function (s) { return contemTermos(s, termos); };
      var achados = r.pizzas;
      var extras = [];
      DADOS.bordas.itens.forEach(function (i) { if (bate(i.nome)) extras.push([i, DADOS.bordas.titulo + " · escolha na montagem da pizza", null]); });
      DADOS.bebidas.forEach(function (g) { g.itens.forEach(function (i) { if (bate(i.nome)) extras.push([i, g.titulo, "bebida:" + g.id + ":" + i.numero]); }); });
      total = achados.length + extras.length;
      if (achados.length) html += htmlCabecalho("Pizzas", "") + "<ul>" + achados.map(function (p) { return htmlPizza(p, termos); }).join("") + "</ul>";
      if (extras.length) html += '<p class="subgrupo">Bordas e bebidas</p><ul>' + extras.map(function (x) { return htmlSimples(x[0], termos, x[1], x[2]); }).join("") + "</ul>";
    }

    if (!total) {
      html = '<div class="vazio"><p>Nada encontrado para “' + esc(t) + '”.</p><p>Tente o número do sabor (01 a 55), o nome ou um ingrediente.</p></div>';
      status.textContent = "";
    } else {
      status.innerHTML = "<strong>" + total + "</strong> " + (total === 1 ? "resultado" : "resultados") + " para “" + esc(t) + "”";
    }
    lista.innerHTML = html;
  }

  function irParaTopoDoCardapio() {
    var corpo = document.querySelector(".corpo");
    var desktop = window.matchMedia("(min-width:960px)").matches;
    var ajuste = desktop ? parseInt(getComputedStyle(document.documentElement).getPropertyValue("--topo"), 10) + 8 : 0;
    var y = corpo.getBoundingClientRect().top + window.scrollY - ajuste;
    if (window.scrollY > y + 2 || window.scrollY < y - 400) window.scrollTo({ top: y });
  }

  campo.addEventListener("input", function () {
    caixa.classList.toggle("com-texto", !!campo.value);
    buscar(campo.value);
  });
  campo.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && campo.value) { campo.value = ""; caixa.classList.remove("com-texto"); buscar(""); }
  });
  document.querySelector(".limpar").addEventListener("click", function () {
    campo.value = ""; caixa.classList.remove("com-texto"); buscar(""); campo.focus();
  });
  botoesCat.forEach(function (b) {
    b.addEventListener("click", function () {
      categoriaAtual = b.dataset.cat;
      campo.value = ""; caixa.classList.remove("com-texto");
      mostrarCategoria(categoriaAtual); marcarCategoria(categoriaAtual);
      irParaTopoDoCardapio();
    });
  });
  var voltar = document.querySelector("[data-voltar-cardapio]");
  if (voltar) voltar.addEventListener("click", function (e) { e.preventDefault(); irParaTopoDoCardapio(); campo.focus({ preventScroll: true }); });

  /* Ação "Escolher" de cada pizza → abre a montagem (js/montagem.js) */
  lista.addEventListener("click", function (e) {
    var b = e.target.closest("[data-escolher]");
    if (b && window.NM.montagem) { window.NM.montagem.abrir(b.getAttribute("data-escolher"), b); return; }
    // Bebidas entram direto no carrinho (sem configurador)
    var a = e.target.closest("[data-adicionar-produto]");
    if (a && window.NM_SELECAO) window.NM_SELECAO.adicionarProduto(a.getAttribute("data-adicionar-produto"));
  });

  mostrarCategoria(categoriaAtual);

  /* ---------- Horário (vem da configuração central) ---------- */
  document.querySelectorAll("[data-horario]").forEach(function (el) { el.textContent = CFG.horario.exibicao; });

  /* ---------- Barra de pedido no celular ---------- */
  (function () {
    var barra = document.querySelector(".barra");
    if (!barra) return;
    var s = { hero: true, fim: false, digitando: false };
    function atualiza() { barra.classList.toggle("on", !s.hero && !s.fim && !s.digitando); }
    if (!("IntersectionObserver" in window)) { barra.classList.add("on"); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.target.hasAttribute("data-cta-hero")) s.hero = e.isIntersecting;
        if (e.target.hasAttribute("data-cta-final")) s.fim = e.isIntersecting;
      });
      atualiza();
    });
    document.querySelectorAll("[data-cta-hero],[data-cta-final]").forEach(function (el) { io.observe(el); });
    campo.addEventListener("focus", function () { s.digitando = true; atualiza(); });
    campo.addEventListener("blur", function () { s.digitando = false; atualiza(); });
  })();
})();
