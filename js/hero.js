/* =====================================================================
   PIZZARIA NOVO MILÊNIO — PIZZA ANIMADA DO HERO
   - A imagem parada (poster) aparece imediatamente (HTML/CSS).
   - O vídeo só começa a baixar depois que a página terminou de carregar,
     na versão adequada à largura da tela (768 px ou 1280 px; WebM com MP4 de reserva).
   - Não carrega o vídeo com "reduzir movimento" ou "economia de dados".
   - Pausa quando o hero sai da tela e quando a aba fica em segundo plano.
   Não interfere em cardápio, carrinho, pedido ou WhatsApp.
   ===================================================================== */
(function () {
  "use strict";

  var video = document.querySelector(".hero-video");
  var area = document.querySelector(".hero-visual");
  if (!video || !area || typeof video.play !== "function") return;

  var reduzir = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  var economia = navigator.connection && navigator.connection.saveData;
  var carregado = false, visivel = true;

  function podeAnimar() { return !(reduzir && reduzir.matches) && !economia; }

  function carregar() {
    if (carregado || !podeAnimar()) return;
    carregado = true;
    var base = window.matchMedia("(min-width: 768px)").matches ? video.dataset.srcGrande : video.dataset.srcPequeno;
    [["webm", "video/webm"], ["mp4", "video/mp4"]].forEach(function (f) {
      var s = document.createElement("source");
      s.src = base + "." + f[0];
      s.type = f[1];
      video.appendChild(s);
    });
    video.muted = true; // exigido para autoplay no celular
    video.addEventListener("playing", function () { area.classList.add("animando"); });
    video.load();
    tocar();
  }

  function tocar() {
    if (!carregado || !visivel || document.hidden || !podeAnimar()) return;
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* autoplay bloqueado: fica a imagem parada */ });
  }
  function pausar() { if (!video.paused) video.pause(); }

  // Pausa fora da tela (economiza bateria e processamento)
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) {
      visivel = e[0].isIntersecting;
      if (visivel) tocar(); else pausar();
    }, { threshold: 0.05 }).observe(area);
  }
  document.addEventListener("visibilitychange", function () { if (document.hidden) pausar(); else tocar(); });

  // Se a pessoa ativar "reduzir movimento" com a página aberta, volta para a imagem parada
  if (reduzir) {
    var mudou = function () {
      if (reduzir.matches) { pausar(); area.classList.remove("animando"); }
      else { carregar(); tocar(); }
    };
    if (reduzir.addEventListener) reduzir.addEventListener("change", mudou); else if (reduzir.addListener) reduzir.addListener(mudou);
  }

  // Só depois do carregamento da página (não disputa banda com o conteúdo principal)
  function iniciar() {
    if ("requestIdleCallback" in window) requestIdleCallback(carregar, { timeout: 1500 });
    else setTimeout(carregar, 300);
  }
  if (document.readyState === "complete") iniciar();
  else window.addEventListener("load", iniciar);
})();
