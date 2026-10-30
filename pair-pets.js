/* Lightweight sprite companions. Music state drives a shared visual beat, not audio analysis. */
(()=>{
 const defaults={enabled:true,desktopSize:112,mobileSize:80,rhythmBpm:100,idleSeconds:12};
 let settings={...defaults},stage,control,pets=[],running=false,raf=0,last=0,clock=0,nextScene=0,scene='rest',sceneEnd=0,drag=null,hidden=false,paused=false,lastTouch=0,bounds={width:0,height:0};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const number=(v,f,a,b)=>Number.isFinite(Number(v))?clamp(Number(v),a,b):f;
 const active=()=>settings.enabled&&!hidden&&!paused&&!document.hidden&&document.body.classList.contains('archive-open')&&!document.body.classList.contains('menu-open')&&!document.getElementById('widgetShelf')?.open;
 const music=()=>document.getElementById('bgmWidget')?.classList.contains('is-playing');
 function layout(){
  if(!stage)return;
  const content=document.querySelector('#archive .content'),r=content.getBoundingClientRect();
  const size=innerWidth<=760?settings.mobileSize:settings.desktopSize;
  const old=bounds;bounds={width:Math.max(0,r.width-12),height:Math.max(0,r.height-12)};
  Object.assign(stage.style,{left:`${r.left+6}px`,top:`${r.top+6}px`,width:`${bounds.width}px`,height:`${bounds.height}px`});
  stage.style.setProperty('--pet-size',`${size}px`);
  for(const [i,p] of pets.entries()){p.size=size;p.x=clamp(old.width?p.x/old.width*bounds.width:bounds.width*.3+i*size,0,Math.max(0,bounds.width-size));p.y=clamp(p.y,0,Math.max(0,bounds.height-size-35));p.target=clamp(p.target||p.x,0,Math.max(0,bounds.width-size));paint(p,0)}
 }
 function say(p,text){p.bubble.textContent=text;p.bubble.hidden=false;p.until=clock+2.4}
 function paint(p,hop){p.el.style.transform=`translate3d(${p.x}px,${Math.max(0,bounds.height-p.size-p.y-8-hop)}px,0)`}
 function stop(){cancelAnimationFrame(raf);raf=0;running=false;last=0}
 function sync(){
  if(!stage)return;
  const entered=document.body.classList.contains('archive-open');
  control.hidden=!settings.enabled||!entered||document.body.classList.contains('menu-open');
  stage.hidden=!active();stage.inert=!active();
  control.querySelector('[data-pet-toggle]').setAttribute('aria-pressed',String(!hidden));
  control.querySelector('[data-pet-toggle]').setAttribute('aria-label',hidden?'캐릭터 보이기':'캐릭터 숨기기');
  control.querySelector('[data-pet-pause]').setAttribute('aria-pressed',String(paused));
  // Paused companions remain visible and stationary.
  if(paused&&!hidden&&settings.enabled&&entered&&!document.hidden&&!document.body.classList.contains('menu-open')&&!document.getElementById('widgetShelf')?.open){stage.hidden=false;stage.inert=false}
  if(active()&&!running){layout();running=true;raf=requestAnimationFrame(tick)}else if(!active())stop();
 }
 function chooseScene(){
  if(reduced.matches){scene='rest';nextScene=clock+settings.idleSeconds;return}
  if(clock-lastTouch>settings.idleSeconds&&Math.random()<.65){scene='meet';const middle=clamp(bounds.width*.48,settings.desktopSize/2,bounds.width);pets[0].target=clamp(middle-pets[0].size*.8,0,bounds.width-pets[0].size);pets[1].target=clamp(middle,0,bounds.width-pets[1].size);sceneEnd=clock+7}
  else{scene='roam';pets.forEach(p=>p.target=Math.random()*Math.max(0,bounds.width-p.size-45));sceneEnd=clock+4.5}
  nextScene=sceneEnd+2.5;
 }
 function tick(t){
  if(!active()){sync();return}
  const dt=Math.min(.05,last?(t-last)/1000:0);last=t;clock+=dt;
  const dancing=music()&&!reduced.matches&&!drag;
  if(!dancing&&!drag&&clock>=nextScene)chooseScene();
  if(scene==='meet'&&!dancing&&!drag&&pets.every(p=>Math.abs(p.x-p.target)<4)){
   scene='cuddle';sceneEnd=clock+3;nextScene=clock+6;say(pets[0],'같이 놀자.');say(pets[1],'응, 여기 있어.');
  }
  if(clock>sceneEnd&&scene!=='rest')scene='rest';
  pets.forEach((p,i)=>{
   if(p.until<clock)p.bubble.hidden=true;
   const grabbed=drag?.p===p;
   if(!grabbed&&p.y>0){p.vy+=dt*700;p.y=Math.max(0,p.y-p.vy*dt);if(!p.y)p.vy=0}
   let walking=false;
   if(!grabbed&&!dancing&&!reduced.matches&&(scene==='roam'||scene==='meet')){const dx=p.target-p.x;walking=Math.abs(dx)>2;p.x+=Math.sign(dx)*Math.min(Math.abs(dx),dt*(scene==='meet'?60:42));}
   let hop=0,angle=0;
   if(!grabbed&&!reduced.matches){
    if(dancing){const beat=clock*settings.rhythmBpm/60*Math.PI*2;hop=Math.max(0,Math.sin(beat))*9;angle=Math.sin(beat)*7}
    else if(p.reaction>clock){hop=Math.sin((p.reaction-clock)*Math.PI*3)**2*18;angle=Math.sin(clock*12)*5}
    else if(walking){hop=Math.abs(Math.sin(clock*9+i))*5;angle=Math.sin(clock*9+i)*4}
    else if(scene==='cuddle'){angle=i?-9:9;hop=Math.abs(Math.sin(clock*3))*2}
   }
   p.el.dataset.motion=grabbed?'drag':dancing?'dance':walking?'walk':scene;
   p.image.style.transform=`rotate(${grabbed?(i?10:-10):angle}deg)`;
   paint(p,hop);
  });
  raf=requestAnimationFrame(tick);
 }
 function react(p){lastTouch=clock;p.reaction=clock+1.1;say(p,p.id==='jaejun'?'도준아, 이리 와.':'형, 같이 있어.');}
 function create(){
  stage=document.createElement('div');stage.id='pairPetStage';stage.hidden=true;stage.setAttribute('aria-label','재준과 도준 캐릭터');
  pets=['jaejun','dojun'].map((id,i)=>{
   const el=document.createElement('button');el.type='button';el.className='pair-pet';el.dataset.pet=id;el.setAttribute('aria-label',`${i?'도준':'재준'} — 누르면 반응, 드래그로 이동`);
   const image=document.createElement('img');image.src=`assets/pets/${id}.png`;image.alt='';image.draggable=false;
   const bubble=document.createElement('span');bubble.className='pet-bubble';bubble.hidden=true;
   el.append(bubble,image);stage.append(el);
   const p={id,el,image,bubble,x:0,y:0,size:0,target:0,vy:0,until:0,reaction:0};
   image.onerror=()=>{el.hidden=true};
   el.addEventListener('pointerdown',e=>{if(e.button!==0)return;lastTouch=clock;drag={p,id:e.pointerId,startX:e.clientX,startY:e.clientY,x:p.x,y:p.y,moved:false};el.setPointerCapture(e.pointerId);e.preventDefault()});
   el.addEventListener('pointermove',e=>{if(drag?.p!==p||drag.id!==e.pointerId)return;const dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;drag.moved ||=Math.hypot(dx,dy)>5;p.x=clamp(drag.x+dx,0,Math.max(0,bounds.width-p.size));p.y=clamp(drag.y-dy,0,Math.max(0,bounds.height-p.size-35));p.target=p.x;p.vy=0;paint(p,0)});
   const release=e=>{if(drag?.p!==p)return;const tap=!drag.moved;drag=null;p.vy=0;scene='rest';nextScene=clock+4;if(tap&&e.type==='pointerup')react(p);if(paused||reduced.matches){p.y=0;paint(p,0)}};
   el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);el.addEventListener('lostpointercapture',release);
   el.addEventListener('click',e=>{if(e.detail===0)react(p)});
   return p;
  });
  control=document.createElement('div');control.id='pairPetControls';control.hidden=true;
  control.innerHTML='<button type="button" data-pet-toggle aria-label="캐릭터 숨기기" aria-pressed="true" title="캐릭터 보이기 / 숨기기"><svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="16" rx="5" ry="4"/><ellipse cx="5" cy="10" rx="2" ry="3"/><ellipse cx="10" cy="6" rx="2" ry="3"/><ellipse cx="16" cy="6" rx="2" ry="3"/><ellipse cx="20" cy="11" rx="2" ry="3"/></svg></button><button type="button" data-pet-pause aria-label="캐릭터 움직임 일시정지" aria-pressed="false" title="움직임 멈추기 / 재개"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12"/></svg></button>';
  control.querySelector('[data-pet-toggle]').onclick=()=>{hidden=!hidden;sync()};
  control.querySelector('[data-pet-pause]').onclick=()=>{paused=!paused;sync()};
  document.body.append(stage,control);
  new ResizeObserver(layout).observe(document.querySelector('#archive .content'));
  new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
  document.getElementById('widgetShelf')?.addEventListener('toggle',sync);
  document.addEventListener('visibilitychange',sync);window.addEventListener('resize',layout);reduced.addEventListener('change',sync);
  layout();sync();
 }
 window.PairPets={configure(value){const v=value||{};settings={enabled:v.enabled!==false,desktopSize:number(v.desktopSize,112,70,150),mobileSize:number(v.mobileSize,80,56,105),rhythmBpm:number(v.rhythmBpm,100,40,180),idleSeconds:number(v.idleSeconds,12,5,120)};if(!stage)create();else{layout();sync()}}};
})();
