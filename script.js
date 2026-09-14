// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// Slideshow - slide push with no page scroll and staggered entries
const nav = document.querySelectorAll('.main-nav a[data-to]');
const sections = ['about','skills','projects','cv'].map(id=>document.getElementById(id)).filter(Boolean);
let curId = null;
const initialId = sections.find(s=> s.classList.contains('active'))?.id || sections[0]?.id;
show(initialId);
function show(id){
  if(id===curId) return;
  const outgoing = document.getElementById(curId);
  const incoming = document.getElementById(id);
  if(outgoing){
    outgoing.classList.add('exit');
    outgoing.classList.remove('active');
    setTimeout(()=> outgoing.classList.remove('exit'), 280);
  }
  if(incoming){
    incoming.classList.add('active');
    incoming.scrollTop = 0;
  }
  nav.forEach(n=> n.classList.toggle('active', n.dataset.to===id));
  const idx = sections.findIndex(s=> s.id===id);
  const names = {about:'About', skills:'Skills', projects:'Projects', cv:'Why me'};
  const pageHeader = document.getElementById('pageHeader');
  if(pageHeader) pageHeader.textContent = String(idx+1).padStart(2,'0') + ' : ' + (names[id] || id);
  const prevIdx = (idx - 1 + sections.length) % sections.length;
  const nextIdx = (idx + 1) % sections.length;
  const prevLabel = document.getElementById('prevLabel');
  const nextLabel = document.getElementById('nextLabel');
  if(prevLabel) prevLabel.textContent = String(prevIdx+1).padStart(2,'0') + ' : ' + names[sections[prevIdx].id];
  if(nextLabel) nextLabel.textContent = String(nextIdx+1).padStart(2,'0') + ' : ' + names[sections[nextIdx].id];
  curId = id;
  const name = document.querySelector('.head-name');
  if(name){
    name.classList.remove('pop');
    void name.offsetWidth;
    name.classList.add('pop');
    setTimeout(()=> name.classList.remove('pop'), 400);
  }
}
// gentle parallax on logos, 4px max
const parallaxLogos = document.querySelectorAll('#top-logo, #corner-logo, .corner-logo');
if(parallaxLogos.length && !window.matchMedia('(hover: none)').matches){
  let raf = null;
  let tx = 0, ty = 0;
  window.addEventListener('mousemove', e=>{
    const nx = (e.clientX / window.innerWidth - 0.5) * 8;
    const ny = (e.clientY / window.innerHeight - 0.5) * 8;
    tx = Math.max(-4, Math.min(4, nx));
    ty = Math.max(-4, Math.min(4, ny));
    if(!raf){
      raf = requestAnimationFrame(()=>{
        parallaxLogos.forEach(el=> el.style.transform = `translate(${tx}px, ${ty}px)`);
        raf = null;
      });
    }
  });
  window.addEventListener('mouseleave', ()=>{
    parallaxLogos.forEach(el=> el.style.transform = 'translate(0,0)');
  });
}
nav.forEach(a=>{
  a.addEventListener('click', ()=> show(a.dataset.to));
});
document.addEventListener('keydown', e=>{
  if(e.target.matches('input, textarea, select, [contenteditable]')) return;
  if(e.metaKey || e.ctrlKey || e.altKey) return;
  if(e.key>='1' && e.key<='4'){
    const idx = parseInt(e.key,10)-1;
    if(idx < sections.length && sections[idx]) show(sections[idx].id);
    return;
  }
  const cur = sections.findIndex(s=> s.classList.contains('active'));
  if(e.key==='ArrowRight' || e.key==='ArrowDown' || e.key==='PageDown'){
    let next = cur + 1;
    if(next>=sections.length) next = 0;
    show(sections[next].id);
    e.preventDefault();
  } else if(e.key==='ArrowLeft' || e.key==='ArrowUp' || e.key==='PageUp'){
    let next = cur - 1;
    if(next<0) next = sections.length-1;
    show(sections[next].id);
    e.preventDefault();
  }
});
document.getElementById('prevBtn')?.addEventListener('click', ()=>{
  const cur = sections.findIndex(s=> s.classList.contains('active'));
  let next = cur-1; if(next<0) next=sections.length-1; show(sections[next].id);
});
document.getElementById('nextBtn')?.addEventListener('click', ()=>{
  const cur = sections.findIndex(s=> s.classList.contains('active'));
  let next = cur+1; if(next>=sections.length) next=0; show(sections[next].id);
});


// Mobile swipe for deck
(function initSwipe(){
  const deck = document.getElementById('deck');
  if(!deck) return;
  let startX = 0, startY = 0, isSwipe = false;
  deck.addEventListener('touchstart', e=>{
    if(e.touches.length!==1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isSwipe = false;
  }, {passive:true});
  deck.addEventListener('touchmove', e=>{
    if(!startX) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    if(Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) isSwipe = true;
  }, {passive:true});
  deck.addEventListener('touchend', e=>{
    if(!isSwipe) { startX=0; return; }
    const dx = e.changedTouches[0].clientX - startX;
    const cur = sections.findIndex(s=> s.classList.contains('active'));
    if(Math.abs(dx) > 40){
      if(dx < 0){
        let next = cur + 1; if(next>=sections.length) next = 0; show(sections[next].id);
      } else {
        let next = cur - 1; if(next<0) next = sections.length-1; show(sections[next].id);
      }
    }
    startX=0; isSwipe=false;
  }, {passive:true});
})();

// IE11 detection and fallback
(function ieFallback(){
  const isIE = !!window.MSInputMethodContext && !!document.documentMode;
  const isOld = isIE || !window.fetch || !window.Promise || !('assign' in Object);
  if(isOld){
    document.documentElement.classList.add('is-legacy');
    // show all slides linearly and disable deck animations
    sections.forEach(s=> { s.style.position='relative'; s.style.display='block'; s.style.opacity='1'; s.style.transform='none'; });
    const deck = document.getElementById('deck');
    if(deck){ deck.style.overflow='visible'; deck.style.height='auto'; }
    const nav = document.getElementById('mainNav');
    if(nav) nav.style.display='none';
    const controls = document.querySelector('.slide-controls');
    if(controls) controls.style.display='none';
    // simple polyfill for fetch if needed
    if(!window.fetch){
      const msg = document.getElementById('projects-container');
      if(msg) msg.innerHTML = '<p style="color:var(--muted); padding:12px;">Projects require a modern browser. Visit <a href="https://github.com/CtrlUserKnown">GitHub</a> directly.</p>';
    }
  }
})();

// Firefox focus ring improvement
document.addEventListener('keydown', e=>{
  if(e.key==='Tab') document.documentElement.classList.add('using-keyboard');
});
document.addEventListener('mousedown', ()=> document.documentElement.classList.remove('using-keyboard'));

// Safari: handle 100vh jump on address bar hide/show
(function safariVhFix(){
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if(!isSafari) return;
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  window.addEventListener('resize', ()=>{
    vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  });
})();

// Theme - follows system
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
function getEffectiveTheme(){
  return document.documentElement.getAttribute('data-theme') || (systemDark.matches ? 'dark' : 'light');
}
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  const favicon = document.getElementById('favicon');
  if(favicon) favicon.href = `img/fav/CJA_logo_adaptive.svg`;
  const topLogo = document.getElementById('top-logo');
  if(topLogo) topLogo.src = `img/svg/CJA_logo_adaptive.svg`;
  document.querySelectorAll('#corner-logo, .corner-logo').forEach(el=>{
    el.src = `img/svg/CJA_logo_adaptive.svg`;
  });
}
(function initTheme(){
  applyTheme(systemDark.matches ? 'dark' : 'light');
  systemDark.addEventListener('change', e=> applyTheme(e.matches ? 'dark' : 'light'));
})();
document.getElementById('theme-toggle')?.addEventListener('click', ()=>{
  const next = getEffectiveTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
});

// GitHub Projects - uses docket layout, no em dashes
const GITHUB_USERNAME = 'CtrlUserKnown';
const FEATURED_REPOS = ['Charvim','ctrlvim','GabyLearnsPython','ssm','Capella.it2249','Capella.it3240'];
async function loadGitHubProjects(){
  const container = document.getElementById('projects-container');
  if(!container) return;
  try{
    const results = await Promise.all(FEATURED_REPOS.map(name =>
      fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${name}`, {headers:{Accept:'application/vnd.github+json'}})
        .then(r=> r.ok ? r.json() : null).catch(()=>null)
    ));
    const repos = results.filter(Boolean);
    if(repos.length===0){
      container.innerHTML = '<p style="color:var(--muted); padding:12px;">Could not load projects right now.</p>';
      return;
    }
    container.innerHTML = repos.map((repo,i)=>{
      const title = repo.name.replace(/-/g,' ').replace(/\b\w/g,l=>l.toUpperCase());
      const desc = repo.description || 'No description yet.';
      const updated = new Date(repo.updated_at).toLocaleDateString('en-US',{month:'short', year:'numeric'});
      const topics = (repo.topics||[]).slice(0,3).map(t=>`<span>${t}</span>`).join('');
      const lang = !topics && repo.language ? `<span>${repo.language}</span>` : '';
      const tags = topics || lang ? `<span class="docket-tags">${topics}${lang}</span>` : '';
      return `<a class="docket" href="${repo.html_url}" target="_blank" rel="noopener">
        <span class="docket-id">${String(i+1).padStart(2,'0')}</span>
        <span class="docket-name">${title}</span>
        <span class="docket-desc">${desc}</span>
        ${tags}
        <span class="docket-date">${updated}</span>
      </a>`;
    }).join('');
  }catch{
    container.innerHTML = '<p style="color:var(--muted); padding:12px;">Could not load projects right now.</p>';
  }
}

// Signal loader after projects render
document.addEventListener('DOMContentLoaded', function(){
  loadGitHubProjects().then(function(){
    if(window._cjaLoaderDone) window._cjaLoaderDone();
  }).catch(function(){
    if(window._cjaLoaderDone) window._cjaLoaderDone();
  });
});
window.addEventListener('pageshow', e=>{ if(e.persisted) window.location.reload(); });
