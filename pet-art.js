/* Per-action sprite frames and optional aligned transparent layers. */
window.PetArt=(()=>{
 const states={idle:'가만히 있기',sit:'앉기',walk:'걷기 · 달리기',jump:'점프 · 클릭 반응',frown:'찡그리기 · 연속 클릭',dance:'음악에 맞춰 춤추기',together:'둘이 만나기',drag:'들어 올리기'};
 const num=(v,d,a,b)=>Number.isFinite(Number(v))?Math.max(a,Math.min(b,Number(v))):d;
 function normalize(value,id){
  const actions={};for(const key of Object.keys(states)){
   const a=value?.actions?.[key]||{},layers={};
   for(const name of ['tail','ears']){const l=a.layers?.[name]||{};layers[name]={image:ArchiveConfig.image(l.image),pivotX:num(l.pivotX,50,0,100),pivotY:num(l.pivotY,70,0,100),swing:num(l.swing,8,0,30)}}
   actions[key]={frames:(Array.isArray(a.frames)?a.frames:[]).slice(0,32).map(f=>ArchiveConfig.image(typeof f==='string'?f:f?.image)).filter(Boolean),fps:num(a.fps,6,1,24),layers};
  }
  return {id,actions,builtin:!Object.values(actions).some(a=>a.frames.length),fallback:`assets/pets/${id}.png`};
 }
 function choose(art,key){const a=art.actions[key];if(a?.frames.length)return a;if(art.actions.idle.frames.length)return art.actions.idle;const first=Object.values(art.actions).find(a=>a.frames.length);if(first)return first;return {frames:[art.fallback],fps:1,layers:{}}}
 function create(parent){
  const group=document.createElement('span');group.className='pet-art';
  const images={};for(const key of ['tail','body','ears']){const img=document.createElement('img');img.alt='';img.draggable=false;img.className=`pet-art-${key}`;if(key!=='body')img.hidden=true;group.append(img);images[key]=img}
  const canvas=document.createElement('canvas');canvas.className='pet-pixel-body';canvas.width=canvas.height=30;canvas.hidden=true;group.append(canvas);parent.append(group);let current='',start=0;
  const assign=(img,src,fallback)=>{if(img.dataset.source===src)return;img.dataset.source=src;img.hidden=!src;if(!src){img.removeAttribute('src');return}img.onerror=()=>{if(fallback&&img.src!==new URL(fallback,location.href).href){img.src=fallback}else img.hidden=true};img.src=src};
  return {group,update(art,key,time,still=false){if(key!==current){current=key;start=time}if(art.builtin&&window.PetPixels){const status=PetPixels.paint(canvas,art.id,key,Math.max(0,time-start),still);canvas.hidden=status!=='ready';group.classList.toggle('is-pixel',status==='ready');if(status==='ready'||status==='loading'){Object.values(images).forEach(img=>img.hidden=true);return true}}else{canvas.hidden=true;group.classList.remove('is-pixel')}const a=choose(art,key);assign(images.body,a.frames[still?0:Math.floor(Math.max(0,time-start)*a.fps)%a.frames.length],art.fallback);for(const name of ['tail','ears']){const l=a.layers[name];assign(images[name],l?.image||'');if(l){images[name].style.transformOrigin=`${l.pivotX}% ${l.pivotY}%`;images[name].style.transform=`rotate(${still?0:Math.sin((time-start)*4+(name==='tail'?0:1))*l.swing}deg)`}}return a.frames.length>1},reset(){current=''}};
 }
 return {states,normalize,choose,create};
})();
