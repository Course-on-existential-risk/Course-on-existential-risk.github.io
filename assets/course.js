"use strict";
const toggle=document.getElementById('menu-toggle');
const sidebar=document.querySelector('.sidebar');
const backdrop=document.querySelector('.sidebar-backdrop');
const mobile=window.matchMedia('(max-width: 900px)');
function setMenu(open){
  document.body.classList.toggle('menu-open',open);
  if(toggle)toggle.setAttribute('aria-expanded',String(open));
  if(sidebar)sidebar.inert=mobile.matches&&!open;
  if(mobile.matches)document.body.style.overflow=open?'hidden':'';
  if(open)sidebar?.querySelector('a')?.focus();
  else if(mobile.matches)toggle?.focus();
}
toggle?.addEventListener('click',()=>setMenu(!document.body.classList.contains('menu-open')));
backdrop?.addEventListener('click',()=>setMenu(false));
document.querySelector('.menu-close')?.addEventListener('click',()=>setMenu(false));
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&document.body.classList.contains('menu-open'))setMenu(false);
  if(event.key==='Tab'&&mobile.matches&&document.body.classList.contains('menu-open')){
    const focusable=[...sidebar.querySelectorAll('a,summary,button')].filter(el=>el.getClientRects().length);
    const first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
});
mobile.addEventListener('change',()=>{document.body.classList.remove('menu-open');document.body.style.overflow='';if(sidebar)sidebar.inert=mobile.matches;toggle?.setAttribute('aria-expanded','false');});
if(sidebar)sidebar.inert=mobile.matches;
const active=sidebar?.querySelector('[aria-current="page"]');
if(active){const nav=sidebar.querySelector('.course-nav');if(nav)nav.scrollTop=Math.max(0,active.offsetTop-nav.offsetTop-nav.clientHeight/3);}

// Home page course map. The data lives in the page so the site stays static and fast.
const mapDataEl=document.getElementById('course-map-data');
let mapData=[];
try{mapData=mapDataEl?JSON.parse(mapDataEl.textContent):[];}catch(error){mapData=[];}
const mapButtons=[...document.querySelectorAll('[data-map-index]')];
const mapKicker=document.getElementById('map-kicker');
const mapTitle=document.getElementById('map-title');
const mapCopy=document.getElementById('map-copy');
const mapLink=document.getElementById('map-link');
function activateMap(index,moveFocus=false){
  const item=mapData[index];
  if(!item)return;
  mapButtons.forEach((button,i)=>{const selected=i===index;button.classList.toggle('is-active',selected);button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;if(selected&&moveFocus)button.focus();});
  document.getElementById('map-detail')?.setAttribute('aria-labelledby',`map-tab-${index}`);
  if(mapKicker)mapKicker.textContent=item.kicker;
  if(mapTitle)mapTitle.textContent=item.title;
  if(mapCopy)mapCopy.textContent=item.body;
  if(mapLink){mapLink.href=item.link;mapLink.innerHTML='';mapLink.append(document.createTextNode(item.link_text+' '));const arrow=document.createElement('span');arrow.setAttribute('aria-hidden','true');arrow.textContent='↗';mapLink.append(arrow);}
}
mapButtons.forEach((button,index)=>button.addEventListener('click',()=>activateMap(index)));
mapButtons.forEach((button,index)=>button.addEventListener('keydown',event=>{
  if(!['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Home','End'].includes(event.key))return;
  event.preventDefault();
  let next=index;
  if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(index+1)%mapButtons.length;
  if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(index-1+mapButtons.length)%mapButtons.length;
  if(event.key==='Home')next=0;
  if(event.key==='End')next=mapButtons.length-1;
  activateMap(next,true);
}));

// Local course progress. Nothing is sent to a server; the learner's browser
// keeps the small set of lessons they have marked complete.
const progressDataEl=document.getElementById('course-progress-data');
let progressData={slugs:[],total:0};
try{progressData=progressDataEl?JSON.parse(progressDataEl.textContent):progressData;}catch(error){progressData={slugs:[],total:0};}
if(!Array.isArray(progressData.slugs))progressData.slugs=[];
const progressTotal=progressData.slugs.length;
const progressKey='pers2002-progress-v1';
const courseRoot=new URL('.',new URL(document.body.dataset.courseRoot||'index.html',document.baseURI));
let sessionProgress=new Set();
let persistentStorage=true;
function readProgress(){
  try{
    const stored=JSON.parse(localStorage.getItem(progressKey)||'[]');
    if(!persistentStorage)return sessionProgress;
    sessionProgress=new Set((Array.isArray(stored)?stored:[]).filter(slug=>progressData.slugs.includes(slug)));
    return sessionProgress;
  }catch(error){persistentStorage=false;return sessionProgress;}
}
function writeProgress(done){sessionProgress=done;try{localStorage.setItem(progressKey,JSON.stringify([...done]));}catch(error){persistentStorage=false;}}
function updateProgress(){
  const done=readProgress();
  const completed=done.size;
  const percent=progressTotal?Math.round((completed/progressTotal)*100):0;
  document.querySelectorAll('[data-progress-percent]').forEach(el=>el.textContent=`${percent}%`);
  document.querySelectorAll('[data-progress-fill]').forEach(el=>el.style.width=`${percent}%`);
  document.querySelectorAll('[data-progress-bar]').forEach(el=>{el.setAttribute('aria-valuenow',String(percent));el.setAttribute('aria-valuetext',`${percent}% complete`);});
  document.querySelectorAll('[data-progress-label]').forEach(el=>el.textContent=`${completed} of ${progressTotal} lessons marked complete`);
  document.querySelectorAll('[data-complete-lesson]').forEach(button=>{
    const complete=done.has(button.dataset.slug||'');
    button.classList.toggle('is-complete',complete);
    button.setAttribute('aria-pressed',String(complete));
    const label=button.querySelector('[data-complete-label]');
    if(label)label.textContent=complete?'Lesson complete':'Mark lesson complete';
  });
  document.querySelectorAll('[data-nav-slug]').forEach(link=>{
    const complete=done.has(link.dataset.navSlug);
    link.classList.toggle('is-done',complete);
    const check=link.querySelector('.nav-check');
    if(check)check.setAttribute('aria-label',complete?'Completed':'');
  });
  const next=progressData.slugs.find(slug=>!done.has(slug));
  document.querySelectorAll('[data-resume]').forEach(link=>{
    link.href=next?new URL(`learn/${next}/index.html`,courseRoot).href:new URL('index.html#curriculum',courseRoot).href;
    link.textContent=completed===progressTotal?'Revisit the course ↗':completed?'Continue learning ↗':'Start learning ↗';
  });
  document.querySelectorAll('[data-storage-note]').forEach(note=>{
    note.textContent=persistentStorage?'Progress is saved in this browser.':'Browser storage is unavailable. Progress is kept for this page only.';
  });
}
document.querySelectorAll('[data-complete-lesson]').forEach(button=>button.addEventListener('click',()=>{
  const done=readProgress();
  const slug=button.dataset.slug||'';
  if(done.has(slug))done.delete(slug);else if(slug)done.add(slug);
  writeProgress(done);
  updateProgress();
}));
document.querySelectorAll('[data-progress-reset]').forEach(button=>button.addEventListener('click',()=>{
  sessionProgress=new Set();
  try{localStorage.removeItem(progressKey);}catch(error){}
  updateProgress();
}));
updateProgress();
window.addEventListener('pageshow',updateProgress);
window.addEventListener('storage',event=>{if(event.key===progressKey||event.key===null)updateProgress();});

// Arrow keys provide a quick, keyboard-friendly route through the course.
const previousPager=document.querySelector('[data-pager="previous"]');
const nextPager=document.querySelector('[data-pager="next"]');
document.addEventListener('keydown',event=>{
  if(event.defaultPrevented||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey) return;
  if(event.target.closest?.('input,textarea,select,button,summary,video,audio,iframe,[contenteditable="true"],.table-scroll')) return;
  if(event.key==='ArrowLeft'&&previousPager){event.preventDefault();previousPager.click();}
  if(event.key==='ArrowRight'&&nextPager){event.preventDefault();nextPager.click();}
});

// Reference shelf filtering. It is deliberately client-side so the public site
// needs no database or account.
const refSearch=document.getElementById('reference-search');
const refCards=[...document.querySelectorAll('[data-reference-card]')];
const refFilters=[...document.querySelectorAll('[data-reference-filter]')];
const refCount=document.getElementById('reference-count');
const refEmpty=document.getElementById('reference-empty');
let refFilter='all';
function filterReferences(){
  const term=(refSearch?.value||'').trim().toLowerCase();
  let visible=0;
  refCards.forEach(card=>{const matchesFilter=refFilter==='all'||card.dataset.category===refFilter;const matchesTerm=!term||card.dataset.search.toLowerCase().includes(term);const show=matchesFilter&&matchesTerm;card.hidden=!show;if(show)visible+=1;});
  if(refCount)refCount.textContent=`${visible} of ${refCards.length} references`;
  if(refEmpty)refEmpty.hidden=visible!==0;
}
refSearch?.addEventListener('input',filterReferences);
refFilters.forEach(button=>button.addEventListener('click',()=>{refFilter=button.dataset.referenceFilter||'all';refFilters.forEach(item=>{const active=item===button;item.classList.toggle('is-active',active);item.setAttribute('aria-pressed',String(active));});filterReferences();}));
