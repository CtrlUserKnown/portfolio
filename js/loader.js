/*
 * Smart Loader — js/loader.js
 * Injects a loading overlay that skips if already seen in this session.
 * Pages signal readiness via window._cjaLoaderDone().
 * Auto-completes on window.load or after 4s, whichever comes first.
 */
(function(){
  'use strict';
  var KEY = 'cja_ll';
  var html = document.documentElement;

  // Inject styles
  var s = document.createElement('style');
  s.textContent =
    '.cja-ld{position:fixed;inset:0;z-index:9999;background:var(--paper);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;padding:env(safe-area-inset-top,0) env(safe-area-inset-right,0) env(safe-area-inset-bottom,0) env(safe-area-inset-left,0);height:100vh;height:100dvh;transition:opacity .4s ease,visibility .4s ease}' +
    '.cja-ld.cja-done{opacity:0;visibility:hidden;pointer-events:none}' +
    '.cja-ld-img{width:120px;height:auto;display:block;animation:cjaPulse 2s ease-in-out infinite}' +
    '@keyframes cjaPulse{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.04)}}' +
    '.cja-ld-txt{font-family:var(--display);font-weight:600;font-size:.88rem;letter-spacing:.04em;color:var(--ink)}' +
    '.cja-ld-dots{display:inline-block;width:1.5em;text-align:left}' +
    '.cja-ld-dots::after{content:".";animation:cjaDot 1.4s steps(1) infinite}' +
    '@keyframes cjaDot{0%{content:"."}33%{content:".."}66%{content:"..."}100%{content:"."}}' +
    '.cja-ld-bar{width:min(260px,70vw);height:6px;border:1.5px solid var(--line);border-radius:999px;overflow:hidden;background:var(--paper-2)}' +
    '.cja-ld-fill{height:100%;width:0%;background:var(--ink);border-radius:999px;transition:width .3s ease}' +
    '.cja-ld-fill.cja-ok{background:var(--accent)}' +
    '.cja-ld-hint{font-size:.58rem;color:var(--muted);letter-spacing:.06em;margin-top:4px;opacity:0;transition:opacity .3s ease}' +
    '.cja-ld-hint.cja-show{opacity:1}' +
    '.cja-ld .cja-skip{position:absolute;top:-100%;left:16px;background:var(--ink);color:var(--paper);padding:8px 14px;font-size:.78rem;font-family:var(--display);text-decoration:none;z-index:10001}' +
    '.cja-ld .cja-skip:focus{top:16px}' +
    '.loader-loading .shell{opacity:0}' +
    '.loader-loading .card{opacity:0}' +
    '@media(max-width:480px){.cja-ld-img{width:80px;height:auto}.cja-ld{gap:18px}}' +
    '@supports (-webkit-touch-callout:none){.cja-ld{height:-webkit-fill-available}}' +
    '@media(prefers-reduced-motion:reduce){.cja-ld,.cja-ld-img,.cja-ld-fill,.cja-ld-hint{animation:none;transition:none}.cja-ld-img{opacity:1}}';
  document.head.appendChild(s);

  // Dynamic viewport fix for browsers without dvh support (older Firefox, etc.)
  // Recalculates height when viewport changes (address bar show/hide)
  function updateVh(){
    ld.style.height = window.innerHeight + 'px';
  }
  if(!CSS.supports('height','100dvh')){
    window.addEventListener('resize', updateVh);
    updateVh();
  }

  // Inject loader HTML
  var ld = document.createElement('div');
  ld.className = 'cja-ld';
  ld.setAttribute('role','status');
  ld.setAttribute('aria-label','Loading');
  ld.innerHTML =
    '<a href="#main" class="cja-skip">Skip to content</a>' +
    '<img class="cja-ld-img" src="img/svg/CJA_logo_adaptive.svg" alt="" width="120" height="154">' +
    '<div class="cja-ld-txt">Loading<span class="cja-ld-dots"></span></div>' +
    '<div class="cja-ld-bar"><div class="cja-ld-fill" id="cjaFill"></div></div>' +
    '<div class="cja-ld-hint" id="cjaHint">Taking longer than expected</div>';
  document.body.appendChild(ld);

  var fill = document.getElementById('cjaFill');
  var hint = document.getElementById('cjaHint');
  var done = false;

  // Skip if already loaded this session
  if(sessionStorage.getItem(KEY)){
    ld.classList.add('cja-done');
    html.classList.remove('loader-loading');
    return;
  }

  // Public API
  window._cjaLoaderReady = function(fn){ if(done) fn(); else readyQueue.push(fn); };
  var readyQueue = [];

  window._cjaLoaderDone = function(){
    if(done) return;
    done = true;
    sessionStorage.setItem(KEY,'1');
    fill.classList.add('cja-ok');
    setTimeout(function(){
      ld.classList.add('cja-done');
      html.classList.remove('loader-loading');
      for(var i=0;i<readyQueue.length;i++) try{ readyQueue[i](); }catch(e){}
      readyQueue=[];
    },350);
  };

  // Progress simulation
  var progress=0, stalled=false;
  function tick(){
    if(done) return;
    var rate = progress<60 ? 1.2 : (progress<85 ? 0.3 : (stalled ? 2 : 0.1));
    progress = Math.min(100, progress + rate + Math.random()*0.6);
    fill.style.width = progress+'%';
    if(progress>=88 && progress<90 && !stalled){
      stalled=true; hint.classList.add('cja-show');
      setTimeout(function(){ stalled=false; hint.classList.remove('cja-show'); },1800);
    }
    if(progress>=100){ window._cjaLoaderDone(); return; }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(function(){ requestAnimationFrame(tick); });

  // Fallback: never block longer than 4s
  setTimeout(function(){ if(!done) window._cjaLoaderDone(); },4000);

  // Also hide on window.load (catches cached/very fast loads)
  window.addEventListener('load', function(){ if(!done) window._cjaLoaderDone(); });
})();
