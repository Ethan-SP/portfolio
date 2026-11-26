import './vendor/liquid-glass/liquidGlass.js';
import {projects,photos} from './content.js';

const projectList=document.querySelector('#project-list');
const photoWindow=document.querySelector('#photo-window-grid');
const desktop=document.querySelector('.desktop');
const detailWindow=document.querySelector('.project-detail-window');
const detailContent=document.querySelector('#project-detail-content');
let topZ=10;
const stacked = matchMedia('(max-width: 900px)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function imageSources(url, sizes) {
  if (!url.startsWith('/media/') || !url.endsWith('-960.webp')) return '';
  return `srcset="${safe(url.replace('-960.webp', '-480.webp'))} 480w, ${safe(url)} 960w" sizes="${sizes}"`;
}

const safe=(value='')=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const iconFor=(type='')=>/CIRCUIT|EMBEDDED|HARDWARE/i.test(type)?'⌁':/CODE|SOFTWARE/i.test(type)?'⌘':'▣';

projects.forEach((project,index)=>{
  const row=document.createElement('button');row.className='project-row';row.type='button';row.dataset.project=String(index);
  row.innerHTML=`<span class="file-icon">${iconFor(project.type)}</span><span class="file-copy"><b>${safe(project.title)}</b><small>${safe(project.type)} · ${safe(project.year)}</small></span><span class="row-chevron">›</span>`;
  projectList.append(row);
});

photos.forEach(photo=>{
  const card=document.createElement('figure');card.className='desktop-photo-card';
  card.innerHTML=`<img src="${safe(photo.image)}" alt="${safe(photo.alt)}" loading="lazy" decoding="async" ${imageSources(photo.image, '(max-width: 900px) 45vw, 250px')}><figcaption><b>${safe(photo.title)}</b><span>${safe(photo.place)}</span></figcaption>`;
  photoWindow.append(card);
});

function focusWindow(win){topZ+=1;win.style.zIndex=String(topZ);document.querySelectorAll('.app-window').forEach(item=>item.classList.toggle('window-active',item===win))}
function openWindow(name){const win=document.querySelector(`[data-window="${name}"]`);if(!win)return;win.hidden=false;win.classList.remove('minimized');win.style.display='';focusWindow(win);if(stacked.matches)win.scrollIntoView({block:'start'});}
function closeWindow(win){win.hidden=true;restoreWindow(win.querySelector('.maximize-window'));syncDock();document.querySelector(`.dock-app[data-open="${win.dataset.window}"]`)?.classList.remove('is-open')}
function showProject(index){const p=projects[index];if(!p)return;detailWindow.hidden=false;detailWindow.style.display='';detailWindow.classList.remove('minimized');detailContent.innerHTML=`<img class="detail-image" decoding="async" ${imageSources(p.image, '(max-width: 900px) 95vw, 520px')} src="${safe(p.image)}" alt="${safe(p.alt)}"><div class="detail-body"><p class="profile-label">${safe(p.type)} · ${safe(p.year)}</p><h3>${safe(p.title)}</h3><p>${safe(p.description)}</p>${p.url?`<a class="mail-button" href="${safe(p.url)}" target="_blank" rel="noopener noreferrer">View project <span>↗</span></a>`:''}</div>`;openWindow('detail')}

projectList.addEventListener('click',event=>{const row=event.target.closest('[data-project]');if(row)showProject(Number(row.dataset.project))});
document.querySelectorAll('.dock-app[data-open]').forEach(button=>button.addEventListener('click',()=>{const name=button.dataset.open;const win=document.querySelector(`[data-window="${name}"]`);if(win&&!win.hidden&&win.classList.contains('minimized')){win.classList.remove('minimized');win.style.display='';focusWindow(win);return}openWindow(name);button.classList.add('is-open')}));
document.querySelectorAll('.close-window').forEach(button=>button.addEventListener('click',()=>closeWindow(button.closest('.app-window'))));
const launcher = document.querySelector('.dock');
const dockEdge = document.querySelector('.dock-edge');

function syncDock() {
  const expanded = document.querySelector('.app-window.maximized:not([hidden])');
  document.documentElement.classList.toggle('workspace-scroll-locked', Boolean(expanded));
  launcher.classList.toggle('auto-hidden', Boolean(expanded));
  launcher.classList.remove('edge-revealed');
  dockEdge.hidden = !expanded;
}
function revealDock() {
  launcher.classList.add('edge-revealed');
}
dockEdge.addEventListener('pointerenter', revealDock);
dockEdge.addEventListener('click', revealDock);
document.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse' || !launcher.classList.contains('auto-hidden')) return;
  if (event.clientY >= innerHeight - 12 || launcher.contains(event.target)) revealDock();
  else if (event.clientY < innerHeight - 100) launcher.classList.remove('edge-revealed');
}, { passive: true });
document.addEventListener('pointerdown', event => {
  if (!launcher.contains(event.target) && !dockEdge.contains(event.target)) {
    launcher.classList.remove('edge-revealed');
  }
});

for (const button of document.querySelectorAll('.minimize-window')) {
  button.addEventListener('click', async () => {
    const win = button.closest('.app-window');
    if (win.dataset.minimizing) return;
    win.dataset.minimizing = 'true';
    const name = win.dataset.window === 'detail' ? 'projects' : win.dataset.window;
    const appButton = launcher.querySelector(`[data-open="${name}"]`);
    if (appButton && !reducedMotion.matches && win.animate) {
      const from = win.getBoundingClientRect();
      const icon = appButton.querySelector('.dock-icon').getBoundingClientRect();
      const base = launcher.getBoundingClientRect();
      const dockOffset = launcher.classList.contains('auto-hidden') &&
        !launcher.classList.contains('edge-revealed')
        ? base.bottom - (innerHeight - parseFloat(getComputedStyle(launcher).bottom))
        : 0;
      const x = icon.left + icon.width / 2 - from.left;
      const y = icon.top + icon.height / 2 - dockOffset - from.top;
      const animation = win.animate([
        { transformOrigin: 'top left', transform: 'none', opacity: 1 },
        { transformOrigin: 'top left', transform: `translate(${x}px, ${y}px) scale(.04)`, opacity: 0 },
      ], { duration: 360, easing: 'cubic-bezier(.35,.02,.6,1)' });
      await animation.finished.catch(() => {});
    }
    delete win.dataset.minimizing;
    restoreWindow(win.querySelector('.maximize-window'));
    win.classList.add('minimized');
    win.style.display = 'none';
    syncDock();
    appButton?.focus({ preventScroll: true });
  });
}
const maximizeButtons = document.querySelectorAll('.maximize-window');
function restoreWindow(button) {
  button.closest('.app-window').classList.remove('maximized');
  button.setAttribute('aria-label', 'Expand window');
}
for (const button of maximizeButtons) {
  restoreWindow(button);
  button.addEventListener('click', () => {
    const win = button.closest('.app-window');
    const wasExpanded = win.classList.contains('maximized');
    maximizeButtons.forEach(restoreWindow);
    if (!wasExpanded) {
      win.classList.add('maximized');
      button.setAttribute('aria-label', 'Restore window size');
    }
    focusWindow(win);
    syncDock();
  });
}
stacked.addEventListener('change', () => { maximizeButtons.forEach(restoreWindow); syncDock(); });
syncDock();
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !document.querySelector('dialog[open]') &&
      document.querySelector('#menubar-dropdown').hidden) {
    maximizeButtons.forEach(restoreWindow);
    syncDock();
  }
});
document.querySelectorAll('.app-window').forEach(win=>win.addEventListener('pointerdown',()=>focusWindow(win)));

// Desktop window dragging and resizing; touch devices retain a readable stacked workspace.
{
  document.querySelectorAll('.window-titlebar').forEach(bar=>bar.addEventListener('pointerdown',event=>{
    if(stacked.matches || event.target.closest('button'))return;const win=bar.closest('.app-window');if(win.classList.contains('maximized'))return;focusWindow(win);
    const rect=win.getBoundingClientRect(),startX=event.clientX,startY=event.clientY;bar.setPointerCapture(event.pointerId);
    const move=e=>{win.style.left=`${Math.max(0,rect.left+e.clientX-startX)}px`;win.style.top=`${Math.max(58,rect.top+e.clientY-startY)}px`;win.style.right='auto';win.style.bottom='auto'};
    const done=()=>{bar.removeEventListener('pointermove',move);bar.removeEventListener('pointerup',done)};
    bar.addEventListener('pointermove',move);bar.addEventListener('pointerup',done);
  }));
  document.querySelectorAll('.resize-handle').forEach(handle=>handle.addEventListener('pointerdown',event=>{
    if(stacked.matches)return;
    const win=handle.closest('.app-window');if(win.classList.contains('maximized'))return;event.preventDefault();event.stopPropagation();focusWindow(win);
    const rect=win.getBoundingClientRect(),startX=event.clientX,startY=event.clientY;handle.setPointerCapture(event.pointerId);
    const move=e=>{win.style.width=`${Math.max(300,rect.width+e.clientX-startX)}px`;win.style.height=`${Math.max(220,rect.height+e.clientY-startY)}px`};
    const done=()=>{handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',done)};
    handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',done);
  }));
}

const menu = document.querySelector('#menubar-dropdown');
const menuBar = document.querySelector('.menubar');
const nameButton = menuBar.querySelector('.menu-name');
const trailingButtons = [...menuBar.querySelectorAll('.menu-left button')].filter(button => button !== nameButton);
let activeMenuButton;

function closeMenu() {
  menu.hidden = true;
  activeMenuButton?.setAttribute('aria-expanded', 'false');
  activeMenuButton = undefined;
}

const menuOptions = {
  work: [['All projects', 'projects'], ...projects.map((project, index) => [project.title, `project-${index}`])],
  view: [['Show all windows', 'all'], ['Close all windows', 'close']],
  help: [['Use the Dock to browse', 'noop']],
};

function renderMenu(options) {
  menu.innerHTML = options.map(([label, value]) =>
    `<button data-menu-action="${value}">${safe(label)}</button>`).join('');
  menu.hidden = false;
  const left = activeMenuButton.getBoundingClientRect().left;
  menu.style.left = `${Math.max(8, Math.min(left, innerWidth - menu.offsetWidth - 8))}px`;
  menu.querySelector('button').focus();
}

function nameMenuOptions() {
  return [
    ...trailingButtons.filter(button => button.hidden).map(button => [
      button.textContent.trim(),
      button.dataset.action || `submenu-${button.dataset.menu}`,
    ]),
    ['Back to desktop', 'home'],
  ];
}

for (const button of [nameButton, ...trailingButtons]) {
  if (button.dataset.action) {
    button.addEventListener('click', () => {
      closeMenu();
      runMenuAction(button.dataset.action);
    });
    continue;
  }
  button.setAttribute('aria-controls', menu.id);
  button.setAttribute('aria-expanded', 'false');
  button.addEventListener('click', () => {
    const wasOpen = activeMenuButton === button;
    closeMenu();
    if (wasOpen) return;
    activeMenuButton = button;
    button.setAttribute('aria-expanded', 'true');
    renderMenu(button === nameButton ? nameMenuOptions() : menuOptions[button.dataset.menu]);
  });
}

function layoutMenuBar() {
  const styles = getComputedStyle(menuBar);
  const gap = parseFloat(getComputedStyle(nameButton.parentElement).columnGap) || 0;
  const available = menuBar.clientWidth - parseFloat(styles.paddingLeft) -
    parseFloat(styles.paddingRight) - document.querySelector('.menu-right').offsetWidth - 24;
  let used = nameButton.offsetWidth;
  let overflow = menuBar.clientWidth <= 360;
  for (const button of trailingButtons) {
    const wasHidden = button.hidden;
    button.hidden = false;
    used += button.offsetWidth + gap;
    overflow ||= used > available;
    button.hidden = overflow;
    if (wasHidden !== overflow && activeMenuButton) closeMenu();
  }
}
layoutMenuBar();
new ResizeObserver(layoutMenuBar).observe(menuBar);

const appearance = document.querySelector('.appearance-panel');
const accentInput = document.querySelector('#accent-color');
const presets = [...document.querySelectorAll('[data-accent]')];

function applyAccent(color) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return;
  document.documentElement.style.setProperty('--portfolio-accent', color);
  accentInput.value = color;
  for (const button of presets) {
    button.setAttribute('aria-pressed', String(button.dataset.accent === color));
  }
  try { localStorage.setItem('portfolio-accent', color); } catch { /* Storage can be disabled. */ }
}

for (const button of presets) {
  button.style.setProperty('--swatch', button.dataset.accent);
  button.addEventListener('click', () => applyAccent(button.dataset.accent));
}
accentInput.addEventListener('input', () => applyAccent(accentInput.value));
try { applyAccent(localStorage.getItem('portfolio-accent') || accentInput.value); }
catch { applyAccent(accentInput.value); }
document.querySelector('#open-appearance').addEventListener('click', () => appearance.showModal());

function runMenuAction(action) {
  if (action === 'home') {
    maximizeButtons.forEach(restoreWindow);
    syncDock();
    window.scrollTo({ top: 0 });
    return;
  }
  if (action === 'appearance') appearance.showModal();
  else if (action === 'all') {
    document.querySelectorAll('.app-window:not(.project-detail-window)').forEach(win => {
      win.hidden = false;
      win.style.display = '';
      win.classList.remove('minimized');
    });
  } else if (action === 'close') document.querySelectorAll('.app-window').forEach(closeWindow);
  else if (action.startsWith('project-')) showProject(Number(action.slice(8)));
  else if (action !== 'noop') openWindow(action);
}
menu.addEventListener('click', event => {
  const action = event.target.closest('[data-menu-action]')?.dataset.menuAction;
  if (!action) return;
  if (action === 'submenu-back') { renderMenu(nameMenuOptions()); return; }
  if (action.startsWith('submenu-')) {
    renderMenu([...menuOptions[action.slice(8)], ['Back', 'submenu-back']]);
    return;
  }
  const trigger = activeMenuButton;
  closeMenu();
  trigger?.focus();
  runMenuAction(action);
});
document.addEventListener('click', event => {
  if (!event.target.closest('.menubar')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || menu.hidden) return;
  const trigger = activeMenuButton;
  closeMenu();
  trigger?.focus();
});

const words = ['circuits', 'code', 'curiosity', 'ideas'];
const typedWord = document.querySelector('#typed-word');
let wordIndex = 0;
let characterCount = words[0].length;
let deleting = true;
let typingTimer;

function typeNextCharacter() {
  if (reducedMotion.matches) return;
  const word = words[wordIndex];
  characterCount += deleting ? -1 : 1;
  typedWord.textContent = word.slice(0, characterCount);

  let delay = deleting ? 45 : 85;
  if (characterCount === 0) {
    wordIndex = (wordIndex + 1) % words.length;
    deleting = false;
    delay = 240;
  } else if (characterCount === word.length) {
    deleting = true;
    delay = 1800;
  }
  typingTimer = window.setTimeout(typeNextCharacter, delay);
}

function resetTyping() {
  window.clearTimeout(typingTimer);
  wordIndex = 0;
  characterCount = words[0].length;
  deleting = true;
  typedWord.textContent = words[0];
  if (!reducedMotion.matches) typingTimer = window.setTimeout(typeNextCharacter, 1800);
}
reducedMotion.addEventListener('change', resetTyping);
resetTyping();

const arizonaClock = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric', minute: '2-digit', timeZone: 'America/Phoenix',
});
function updateClock() {
  document.querySelector('#menu-clock').textContent = `${arizonaClock.format(new Date())} MST`;
}
updateClock();
setInterval(updateClock, 30000);

// Reveal the desktop windows as scroll brings them into view; subtle scene depth on larger screens.
if (!reducedMotion.matches && 'IntersectionObserver' in window) {
const revealObserver = new IntersectionObserver((entries, observer) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add('is-revealed');
    observer.unobserve(entry.target);
  }
}, { threshold: 0.08 });

document.querySelectorAll('.app-window:not(.project-detail-window) .window-content, .desktop-photo-card').forEach(content => {
  if (content.getBoundingClientRect().top < innerHeight - 64) return;
  content.classList.add('scroll-reveal');
  revealObserver.observe(content);
});
const dock=document.querySelector('.dock');
let scrollFrame=0;
function updateScene(){
  scrollFrame=0;
  const y=window.scrollY;
  document.querySelector('.desktop')?.style.setProperty('--scene-shift',`${Math.min(y*.04,28)}px`);
  if(!stacked.matches){document.querySelectorAll('.app-window').forEach((win,index)=>{const rect=win.getBoundingClientRect();if(rect.bottom>0&&rect.top<innerHeight){const center=rect.top+rect.height/2-innerHeight/2;win.style.setProperty('--scroll-shift',`${Math.max(-7,Math.min(7,-center*.008+(index%2?2:-2)))}px`);win.style.setProperty('--scroll-tilt',`${Math.max(-.35,Math.min(.35,-center*.0004))}deg`)}})}
  dock?.classList.toggle('is-scrolled',y>48);
}
window.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScene)},{passive:true});window.addEventListener('resize',updateScene);updateScene();

}
