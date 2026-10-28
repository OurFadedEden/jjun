/* Station widgets are configuration-driven; no remote message storage. */
const stationAudio = new Audio();
stationAudio.preload='none';
let dayTimer;
function applyStation(){
 const h=config.hud;
 const text=(selector,value)=>{const el=document.querySelector(selector);if(el)el.textContent=value??''};
 text('.depth-instrument .instrument-heading',h.resonanceTitle+' / '+h.pairLabel);
 text('.depth-readout>span:first-child',h.channelLabel);
 text('.depth-readout strong',h.channel);
 text('.depth-readout small',h.resonanceCaption);
 text('.depth-readout>span:last-child',h.pairCaption);
 text('.signal-instrument .instrument-heading',h.echoTitle+' / '+h.echoChannel);
 text('.signal-legend span:first-child','● '+h.signalOne);text('.signal-legend span:last-child','● '+h.signalTwo);
 text('.station-strip span:first-child',h.station);text('.station-strip span:nth-child(2)',h.coordinates);text('.station-strip span:last-child',h.connection);
 text('.station-end>span:nth-child(2)',h.endTitle+'\n'+h.endNote);text('.station-end>span:last-child',config.header.tape);
 text('.mobile-observations summary',h.observationTitle);text('#backButton',h.returnLabel);text('#widgetSummary',h.widgetTitle);
 text('#archiveStamp',config.decor.stamp);
 const frame=document.querySelector('#archive .frame');
 frame.dataset.decor=config.decor.enabled?'on':'off';frame.dataset.grid=config.decor.grid?'on':'off';frame.dataset.frame=config.decor.frame;
 frame.style.setProperty('--margin-note',JSON.stringify(config.decor.verticalText));
 renderDayWidget();clearInterval(dayTimer);dayTimer=setInterval(renderDayWidget,60000);
 renderBgmWidget();renderMessages();
 document.getElementById('widgetShelf').hidden=!config.messages.enabled;
 document.getElementById('widgetShelf').open=true;
}
function renderDayWidget(){
 const root=document.getElementById('dayWidget'),d=config.dayCounter;root.hidden=!d.enabled;if(!d.enabled)return;
 const count=ArchiveConfig.dayInfo(d),days=count.days;
 const max=Math.max(100,Math.ceil(Math.max(days,1)/100)*100),ratio=Math.min(100,days/max*100);
 root.innerHTML=`<div class="instrument-heading">${escapeHTML(d.title)}</div><div class="day-gauge"><div class="day-ruler" aria-hidden="true"><span>0</span><span>${Math.round(max/2)}</span><span>${max}</span><i style="top:${ratio}%"></i></div><div class="day-reading"><div class="day-name">${escapeHTML(d.name)}</div><strong id="dayValue">${count.future?'−':''}${days.toLocaleString('ko-KR')}<small>${escapeHTML(count.future?'':d.unit)}</small></strong><span id="dayDescription">${count.future?escapeHTML(d.futureLabel)+' '+days+'일':days+escapeHTML(d.suffix)}</span><time datetime="${escapeHTML(d.startDate)}">${escapeHTML(d.startDate.replaceAll('-','.'))}</time></div></div>`;
}
function renderBgmWidget(){
 const b=config.bgm,root=document.getElementById('bgmWidget');root.hidden=!b.enabled;
 stationAudio.onplay=stationAudio.onpause=stationAudio.onended=stationAudio.onerror=null;
 stationAudio.pause();stationAudio.removeAttribute('src');stationAudio.load();
 const media=ArchiveConfig.mediaSource(b.src),youtube=media.type==='youtube';
 if(media.type==='audio')stationAudio.src=media.url;
 stationAudio.volume=b.volume;stationAudio.loop=b.loop;
 root.innerHTML=`<div class="radio-emblem" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="radio-copy"><h3>${escapeHTML(b.title)}</h3><p class="track-title">${escapeHTML(b.trackTitle)}</p></div><div class="bgm-controls"><button id="bgmPlay" type="button" aria-pressed="false" ${youtube?'aria-expanded="false" aria-controls="youtubePanel"':''} ${['empty','invalid'].includes(media.type)?'disabled':''}>${escapeHTML(youtube?b.youtubeOpenLabel:b.playLabel)}</button>${youtube?'':`<label><span class="sr-only">${escapeHTML(b.volumeLabel)}</span><input id="bgmVolume" type="range" min="0" max="1" step="0.05" value="${b.volume}" aria-label="${escapeHTML(b.volumeLabel)}"></label>`}</div><p id="bgmStatus" role="status">${media.type==='empty'?escapeHTML(b.emptyText):media.type==='invalid'?escapeHTML(b.errorText):''}</p>${youtube?`<section id="youtubePanel" hidden aria-label="YouTube 플레이어"><div id="youtubeMount"></div><p>${escapeHTML(b.youtubeHint)}</p><a href="${escapeHTML(media.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(b.youtubeFallbackLabel)}</a></section>`:''}`;
 const button=document.getElementById('bgmPlay'),status=document.getElementById('bgmStatus');
 if(youtube){
  const panel=document.getElementById('youtubePanel'),mount=document.getElementById('youtubeMount');
  button.onclick=()=>{
   const open=panel.hidden;panel.hidden=!open;
   button.textContent=open?b.youtubeCloseLabel:b.youtubeOpenLabel;
   button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-pressed',String(open));
   if(!open){mount.replaceChildren();return}
   const url=new URL('https://www.youtube-nocookie.com/embed/'+media.id);
   url.searchParams.set('autoplay','1');url.searchParams.set('playsinline','1');url.searchParams.set('controls','1');
   if(media.start)url.searchParams.set('start',String(media.start));
   if(b.loop){url.searchParams.set('loop','1');url.searchParams.set('playlist',media.id)}
   const iframe=document.createElement('iframe');iframe.src=url.href;iframe.title=b.trackTitle+' — YouTube';iframe.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';iframe.allowFullscreen=true;iframe.referrerPolicy='strict-origin-when-cross-origin';mount.replaceChildren(iframe);
  };
  panel.addEventListener('keydown',e=>{if(e.key==='Escape'){button.click();button.focus()}});
  return;
 }
 const sync=()=>{button.textContent=stationAudio.paused?b.playLabel:b.pauseLabel;button.setAttribute('aria-pressed',String(!stationAudio.paused));root.classList.toggle('is-playing',!stationAudio.paused)};
 stationAudio.onplay=sync;stationAudio.onpause=sync;stationAudio.onended=sync;
 stationAudio.onerror=()=>{status.textContent=b.errorText;sync()};
 button.onclick=async()=>{if(!stationAudio.paused){stationAudio.pause();return}try{await stationAudio.play();status.textContent=''}catch(_){status.textContent=b.errorText;sync()}};
 document.getElementById('bgmVolume').oninput=e=>stationAudio.volume=Number(e.target.value);
}
function renderMessages(){
 const m=config.messages,root=document.getElementById('messageWidget');root.hidden=!m.enabled;
 root.innerHTML=`<h3>${escapeHTML(m.title)}</h3><p class="message-subtitle">${escapeHTML(m.subtitle)}</p><div class="message-log" tabindex="0" aria-label="${escapeHTML(m.title)}">${m.items.length?m.items.map(x=>`<article class="message-bubble ${x.side==='right'?'from-right':''}"><header><b>${escapeHTML(x.sender)}</b><span>${escapeHTML(x.time)}</span></header><p>${nl(x.body)}</p></article>`).join(''):`<p class="empty-message">${escapeHTML(m.emptyText)}</p>`}</div>`;
}

// Mobile drawer: closed by default, with keyboard focus kept in the open panel.
const sidebarMedia=matchMedia('(max-width:760px)');
const archiveSidebar=document.getElementById('archiveSidebar');
const menuToggle=document.getElementById('archiveMenuToggle');
function closeArchiveMenu(restoreFocus=true){setArchiveMenu(false,restoreFocus)}
function setArchiveMenu(open,restoreFocus=false){
 open=Boolean(open&&sidebarMedia.matches);
 document.body.classList.toggle('menu-open',open);
 menuToggle.setAttribute('aria-expanded',String(open));
 document.getElementById('sidebarBackdrop').hidden=!open;
 archiveSidebar.inert=sidebarMedia.matches&&!open;
 if(sidebarMedia.matches)archiveSidebar.setAttribute('aria-hidden',String(!open));else archiveSidebar.removeAttribute('aria-hidden');
 if(open){archiveSidebar.setAttribute('role','dialog');archiveSidebar.setAttribute('aria-modal','true')}else{archiveSidebar.removeAttribute('role');archiveSidebar.removeAttribute('aria-modal')}
 document.querySelector('#archive .content').inert=open;
 document.querySelector('#archive .topbar').inert=open;
 document.querySelector('#archive .footer').inert=open;
 if(open){document.getElementById('archiveMenuClose').focus();requestAnimationFrame(()=>{if(document.body.classList.contains('menu-open')&&!archiveSidebar.contains(document.activeElement))document.getElementById('archiveMenuClose').focus()})}else if(restoreFocus&&sidebarMedia.matches)menuToggle.focus();
}
menuToggle.onclick=()=>setArchiveMenu(true);
document.getElementById('archiveMenuClose').onclick=()=>closeArchiveMenu();
document.getElementById('sidebarBackdrop').onclick=()=>closeArchiveMenu();
sidebarMedia.addEventListener('change',()=>closeArchiveMenu(false));
document.addEventListener('keydown',e=>{
 if(!document.body.classList.contains('menu-open'))return;
 if(e.key==='Escape'){e.preventDefault();closeArchiveMenu();return}
 if(e.key==='Tab'){
  const items=[...archiveSidebar.querySelectorAll('button:not([disabled]),a[href],input,[tabindex="0"]')].filter(el=>el.getClientRects().length);
  const first=items[0],last=items.at(-1);
  if(e.shiftKey&&(document.activeElement===first||!archiveSidebar.contains(document.activeElement))){e.preventDefault();last?.focus()}
  else if(!e.shiftKey&&(document.activeElement===last||!archiveSidebar.contains(document.activeElement))){e.preventDefault();first?.focus()}
 }
});
closeArchiveMenu(false);

// Keep observation widgets reachable in the main content on small screens.
const observationShelf=document.createElement('details');
observationShelf.className='widget-shelf mobile-observations';
observationShelf.innerHTML='<summary>소나 · 함께한 날짜 · 공명계 · 신호파형</summary><div class="observation-grid"></div>';
document.getElementById('widgetShelf').before(observationShelf);
const observationWidgets=[...archiveSidebar.querySelectorAll('.sonar-panel,#dayWidget,.depth-instrument,.signal-instrument')].map(node=>{
 const marker=document.createComment('observation position');node.before(marker);return {node,marker};
});
function placeObservationWidgets(){
 observationShelf.hidden=!sidebarMedia.matches;
 for(const {node,marker} of observationWidgets){
  if(sidebarMedia.matches)observationShelf.querySelector('.observation-grid').append(node);
  else marker.after(node);
 }
}
sidebarMedia.addEventListener('change',placeObservationWidgets);
placeObservationWidgets();
