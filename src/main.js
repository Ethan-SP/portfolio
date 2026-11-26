import {projects,photos} from './content.js';

const projectList=document.querySelector('#project-list');
const photoWindow=document.querySelector('#photo-window-grid');
const desktop=document.querySelector('.desktop');
const detailWindow=document.querySelector('.project-detail-window');
const detailContent=document.querySelector('#project-detail-content');
let topZ=10;

const safe=(value='')=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const iconFor=(type='')=>/CIRCUIT|EMBEDDED|HARDWARE/i.test(type)?'⌁':/CODE|SOFTWARE/i.test(type)?'⌘':'▣';

projects.forEach((project,index)=>{
  const row=document.createElement('button');row.className='project-row';row.type='button';row.dataset.project=String(index);
  row.innerHTML=`<span class="file-icon">${iconFor(project.type)}</span><span class="file-copy"><b>${safe(project.title)}</b><small>${safe(project.type)} · ${safe(project.year)}</small></span><span class="row-chevron">›</span>`;
  projectList.append(row);
});

photos.forEach(photo=>{
  const card=document.createElement('figure');card.className='desktop-photo-card';
  card.innerHTML=`<img src="${safe(photo.image)}" alt="${safe(photo.alt)}" loading="lazy"><figcaption><b>${safe(photo.title)}</b><span>${safe(photo.place)}</span></figcaption>`;
  photoWindow.append(card);
});

function focusWindow(win){topZ+=1;win.style.zIndex=String(topZ);document.querySelectorAll('.app-window').forEach(item=>item.classList.toggle('window-active',item===win))}
function openWindow(name){const win=document.querySelector(`[data-window="${name}"]`);if(!win)return;win.hidden=false;win.classList.remove('minimized');win.style.display='';focusWindow(win);if(innerWidth<700)win.scrollIntoView({behavior:'smooth',block:'center'});}
function closeWindow(win){win.hidden=true;document.querySelector(`.dock-app[data-open="${win.dataset.window}"]`)?.classList.remove('is-open')}
function showProject(index){const p=projects[index];if(!p)return;detailWindow.hidden=false;detailWindow.style.display='';detailWindow.classList.remove('minimized');detailContent.innerHTML=`<img class="detail-image" src="${safe(p.image)}" alt="${safe(p.alt)}"><div class="detail-body"><p class="profile-label">${safe(p.type)} · ${safe(p.year)}</p><h3>${safe(p.title)}</h3><p>${safe(p.description)}</p>${p.url?`<a class="mail-button" href="${safe(p.url)}" target="_blank" rel="noopener noreferrer">View project <span>↗</span></a>`:''}</div>`;openWindow('detail')}

projectList.addEventListener('click',event=>{const row=event.target.closest('[data-project]');if(row)showProject(Number(row.dataset.project))});
document.querySelectorAll('.dock-app').forEach(button=>button.addEventListener('click',()=>{const name=button.dataset.open;const win=document.querySelector(`[data-window="${name}"]`);if(win&&!win.hidden&&win.classList.contains('minimized')){win.classList.remove('minimized');win.style.display='';focusWindow(win);return}openWindow(name);button.classList.add('is-open')}));
document.querySelectorAll('.close-window').forEach(button=>button.addEventListener('click',()=>closeWindow(button.closest('.app-window'))));
document.querySelectorAll('.minimize-window').forEach(button=>button.addEventListener('click',()=>{const win=button.closest('.app-window');win.classList.add('minimized');setTimeout(()=>{if(win.classList.contains('minimized'))win.style.display='none'},220)}));
document.querySelectorAll('.maximize-window').forEach(button=>button.addEventListener('click',()=>{const win=button.closest('.app-window');win.classList.toggle('maximized');focusWindow(win)}));
document.querySelectorAll('.app-window').forEach(win=>win.addEventListener('pointerdown',()=>focusWindow(win)));

// Desktop window dragging and resizing; touch devices retain a readable stacked workspace.
if(matchMedia('(min-width: 700px)').matches){
  document.querySelectorAll('.window-titlebar').forEach(bar=>bar.addEventListener('pointerdown',event=>{
    if(event.target.closest('button'))return;const win=bar.closest('.app-window');if(win.classList.contains('maximized'))return;focusWindow(win);
    const rect=win.getBoundingClientRect(),startX=event.clientX,startY=event.clientY;bar.setPointerCapture(event.pointerId);
    const move=e=>{win.style.left=`${Math.max(0,rect.left+e.clientX-startX)}px`;win.style.top=`${Math.max(58,rect.top+e.clientY-startY)}px`;win.style.right='auto';win.style.bottom='auto'};
    const done=()=>{bar.removeEventListener('pointermove',move);bar.removeEventListener('pointerup',done)};
    bar.addEventListener('pointermove',move);bar.addEventListener('pointerup',done);
  }));
  document.querySelectorAll('.resize-handle').forEach(handle=>handle.addEventListener('pointerdown',event=>{
    const win=handle.closest('.app-window');if(win.classList.contains('maximized'))return;event.preventDefault();event.stopPropagation();focusWindow(win);
    const rect=win.getBoundingClientRect(),startX=event.clientX,startY=event.clientY;handle.setPointerCapture(event.pointerId);
    const move=e=>{win.style.width=`${Math.max(300,rect.width+e.clientX-startX)}px`;win.style.height=`${Math.max(220,rect.height+e.clientY-startY)}px`};
    const done=()=>{handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',done)};
    handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',done);
  }));
}

document.querySelectorAll('.menu-name,.menu-left [data-menu]').forEach(button=>button.addEventListener('click',()=>{
  const menu=document.querySelector('#menubar-dropdown');const selected=button.dataset.menu;
  if(!menu.hidden&&menu.dataset.active===selected){menu.hidden=true;return}
  const options=selected==='portfolio'?[['Open Projects','projects'],['Open Photography','photos'],['About Me','about'],['Contact','contact']]:selected==='file'?[['New project window','projects'],['New photo window','photos']]:selected==='view'?[['Show all windows','all'],['Close all windows','close']]:[['Use the Dock to browse','noop']];
  menu.dataset.active=selected;menu.innerHTML=options.map(([label,value])=>`<button data-menu-action="${value}">${safe(label)}</button>`).join('');menu.hidden=false;
}));
document.querySelector('#menubar-dropdown').addEventListener('click',event=>{const action=event.target.closest('[data-menu-action]')?.dataset.menuAction;if(!action)return;if(action==='all')document.querySelectorAll('.app-window').forEach(win=>{win.hidden=false;win.style.display='';win.classList.remove('minimized')});else if(action==='close')document.querySelectorAll('.app-window').forEach(closeWindow);else if(action!=='noop')openWindow(action);document.querySelector('#menubar-dropdown').hidden=true});
document.addEventListener('click',event=>{if(!event.target.closest('.menubar'))document.querySelector('#menubar-dropdown').hidden=true});

const words=['circuits','code','curiosity','ideas'];const target=document.querySelector('#typed-word');let wordIndex=0;
if(!matchMedia('(prefers-reduced-motion: reduce)').matches)setInterval(()=>{target.classList.add('changing');setTimeout(()=>{wordIndex=(wordIndex+1)%words.length;target.textContent=words[wordIndex];target.classList.remove('changing')},220)},3400);else document.querySelector('.cursor')?.remove();
function updateClock(){const now=new Date();document.querySelector('#menu-clock').textContent=new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit'}).format(now)}updateClock();setInterval(updateClock,30000);
