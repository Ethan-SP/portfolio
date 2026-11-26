import {projects,photos} from './content.js';
const projectGrid=document.querySelector('#project-grid');
for(const p of projects){const article=document.createElement('article');article.className='project-card';article.innerHTML=`<div class="project-image"><img src="${p.image}" alt="${p.alt}" loading="lazy"><span class="project-number">${p.number}</span><span class="image-arrow">↗</span></div><div class="project-info"><div class="project-kicker"><span>${p.type}</span><span>${p.year}</span></div><h3>${p.title}</h3><p>${p.description}</p></div>`;projectGrid.append(article)}
const photoGrid=document.querySelector('#photo-grid');
for(const p of photos){const figure=document.createElement('figure');figure.className='photo-card';figure.innerHTML=`<div class="photo-image"><img src="${p.image}" alt="${p.alt}" loading="lazy"><span class="photo-arrow">↗</span></div><figcaption><span>${p.title}</span><span>${p.place}</span></figcaption>`;photoGrid.append(figure)}
const words=['circuits','code','curiosity','ideas'];
const target=document.querySelector('#typed-word');let index=0;
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!reduceMotion){setInterval(()=>{target.classList.add('changing');setTimeout(()=>{index=(index+1)%words.length;target.textContent=words[index];target.classList.remove('changing')},240)},3200)}else{document.querySelector('.cursor')?.remove()}

const revealTargets=document.querySelectorAll('.section-head,.project-card,.about-copy,.about-card,.photo-card,.contact-section');
if('IntersectionObserver' in window && !reduceMotion){
  revealTargets.forEach((item,i)=>{item.classList.add('reveal');item.style.setProperty('--reveal-delay',`${(i%3)*80}ms`)});
  const observer=new IntersectionObserver((entries,watcher)=>{for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('is-visible');watcher.unobserve(entry.target)}}},{rootMargin:'0px 0px -8% 0px',threshold:.12});
  revealTargets.forEach(item=>observer.observe(item));
}

const progress=document.createElement('div');progress.className='scroll-progress';progress.setAttribute('aria-hidden','true');document.body.append(progress);
let ticking=false;
const updateProgress=()=>{const max=document.documentElement.scrollHeight-innerHeight;progress.style.transform=`scaleX(${max>0?scrollY/max:0})`;ticking=false};
window.addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(updateProgress);ticking=true}},{passive:true});updateProgress();
const activeLinks=[...document.querySelectorAll('.topbar nav a')];
if('IntersectionObserver' in window){const sectionObserver=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting){activeLinks.forEach(a=>a.classList.toggle('active',a.hash===`#${e.target.id}`))}}},{rootMargin:'-35% 0px -55% 0px'});document.querySelectorAll('main section[id]').forEach(s=>sectionObserver.observe(s))}

