const uiIcon=(name)=>`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${({play:'<path d="m9 5 10 7-10 7Z"/>',pause:'<path d="M8 5v14M16 5v14"/>',stop:'<rect x="6" y="6" width="12" height="12"/>',signal:'<circle cx="12" cy="12" r="2"/><path d="M7 7a7 7 0 0 0 0 10M17 7a7 7 0 0 1 0 10M4 4a11 11 0 0 0 0 16M20 4a11 11 0 0 1 0 16"/>'})[name]}</svg>`;
function bgmIcon(button,playing,youtube,b){const label=playing?(youtube?b.youtubeCloseLabel:b.pauseLabel):(youtube?b.youtubeOpenLabel:b.playLabel);button.innerHTML=uiIcon(playing?(youtube?'stop':'pause'):'play');button.setAttribute('aria-label',label);button.title=label;}
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
 text('#backButton',h.returnLabel);const widgetButton=document.getElementById('widgetSummary');widgetButton.innerHTML=uiIcon('signal');widgetButton.setAttribute('aria-label',h.widgetTitle);widgetButton.title=h.widgetTitle;
 text('#archiveStamp',config.decor.stamp);
 const frame=document.querySelector('#archive .frame');document.documentElement.dataset.protectImages=config.decor.protectImages?'on':'off';
 frame.dataset.decor=config.decor.enabled?'on':'off';frame.dataset.grid=config.decor.grid?'on':'off';frame.dataset.frame=config.decor.frame;
 frame.style.setProperty('--margin-note',JSON.stringify(config.decor.verticalText));
 renderDayWidget();clearInterval(dayTimer);dayTimer=setInterval(renderDayWidget,60000);
 renderBgmWidget();renderMessages();
 document.getElementById('widgetShelf').hidden=!config.messages.enabled;
 document.getElementById('widgetShelf').open=false;
}
function renderDayWidget(){
 const root=document.getElementById('dayWidget'),d=config.dayCounter;root.hidden=!d.enabled;if(!d.enabled)return;
 const count=ArchiveConfig.dayInfo(d),days=count.days;
 const max=Number.isFinite(Number(d.maxDepth))&&Number(d.maxDepth)>0?Number(d.maxDepth):10928,ratio=Math.min(100,days/max*100);
 root.innerHTML=`<div class="instrument-heading">${escapeHTML(d.title)}</div><div class="day-gauge"><div class="day-ruler" aria-hidden="true"><span>0</span><span>${Math.round(max/2).toLocaleString('ko-KR')}</span><span>${max.toLocaleString('ko-KR')}</span><i style="top:${ratio}%"></i></div><div class="day-reading"><div class="day-name">${escapeHTML(d.name)}</div><strong id="dayValue">${count.future?'−':''}${days.toLocaleString('ko-KR')}<small>${escapeHTML(count.future?'':d.unit)}</small></strong><span id="dayDescription">${count.future?escapeHTML(d.futureLabel)+' '+days+'일':days+escapeHTML(d.suffix)}</span><time datetime="${escapeHTML(d.startDate)}">${escapeHTML(d.startDate.replaceAll('-','.'))}</time></div></div>`;
}
let selectedBgm=0,youtubeBgm=null;
function renderBgmWidget(){
 youtubeBgm?.destroy();youtubeBgm=null;
 const base=config.bgm,tracks=base.tracks?.length?base.tracks:[{title:base.trackTitle,src:base.src}];
 selectedBgm=Math.min(selectedBgm,tracks.length-1);
 const b={...base,src:tracks[selectedBgm].src,trackTitle:tracks[selectedBgm].title},root=document.getElementById('bgmWidget');root.hidden=!b.enabled;root.classList.remove('is-playing');
 stationAudio.onplay=stationAudio.onpause=stationAudio.onended=stationAudio.onerror=null;
 stationAudio.pause();stationAudio.removeAttribute('src');stationAudio.load();
 const media=ArchiveConfig.mediaSource(b.src),youtube=media.type==='youtube';root.dataset.source=media.type;
 if(media.type==='audio')stationAudio.src=media.url;
 stationAudio.volume=b.volume;stationAudio.loop=b.loop;
 root.innerHTML=`<div class="radio-emblem" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="radio-copy"><h3>${escapeHTML(b.title)}</h3><p class="track-title">${escapeHTML(b.trackTitle)}</p></div><div class="bgm-controls"><button id="bgmPlay" type="button" aria-pressed="false" ${youtube?'aria-expanded="false" aria-controls="youtubePanel"':''} ${['empty','invalid'].includes(media.type)?'disabled':''}>${escapeHTML(youtube?b.youtubeOpenLabel:b.playLabel)}</button>${`<label><span class="sr-only">${escapeHTML(b.volumeLabel)}</span><input id="bgmVolume" type="range" min="0" max="1" step="0.05" value="${b.volume}" aria-label="${escapeHTML(b.volumeLabel)}"></label>`}</div><p id="bgmStatus" role="status">${media.type==='empty'?escapeHTML(b.emptyText):media.type==='invalid'?escapeHTML(b.errorText):''}</p>${youtube?`<section id="youtubePanel" hidden aria-label="YouTube 플레이어"><div id="youtubeMount"></div><p>${escapeHTML(b.youtubeHint)}</p><a href="${escapeHTML(media.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(b.youtubeFallbackLabel)}</a></section>`:''}`;
 if(tracks.length>1){const copy=root.querySelector('.radio-copy'),select=document.createElement('select');select.id='bgmPlaylist';select.setAttribute('aria-label','BGM 곡 선택');tracks.forEach((t,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=String(i+1).padStart(2,'0')+' / '+(t.title||'Untitled');select.append(option)});select.value=String(selectedBgm);copy.querySelector('.track-title').hidden=true;copy.append(select);select.onchange=()=>{selectedBgm=Number(select.value);renderBgmWidget();document.getElementById('bgmPlaylist')?.focus()}}
 const button=document.getElementById('bgmPlay'),status=document.getElementById('bgmStatus');bgmIcon(button,false,youtube,b);
 if(youtube){
  document.getElementById('youtubePanel')?.remove();button.removeAttribute('aria-expanded');button.removeAttribute('aria-controls');
  const sync=playing=>{bgmIcon(button,playing,false,b);button.setAttribute('aria-pressed',String(playing));root.classList.toggle('is-playing',playing);if(playing)status.textContent=''};
  bgmIcon(button,false,false,b);
  youtubeBgm=YouTubeBgm.mount({id:media.id,start:media.start,volume:b.volume,loop:b.loop,change:sync,error:()=>{status.textContent='재생할 수 없어요. 재생 버튼을 다시 누르거나 다른 곡을 선택해 주세요.'},ended:tracks.length>1?()=>{selectedBgm=(selectedBgm+1)%tracks.length;renderBgmWidget();document.getElementById('bgmPlay').click()}:null});
  button.onclick=()=>youtubeBgm.toggle();document.getElementById('bgmVolume').oninput=e=>youtubeBgm.volume(Number(e.target.value));return;
 }
 const sync=()=>{bgmIcon(button,!stationAudio.paused,false,b);button.setAttribute('aria-pressed',String(!stationAudio.paused));root.classList.toggle('is-playing',!stationAudio.paused)};
 stationAudio.onplay=sync;stationAudio.onpause=sync;stationAudio.onended=sync;
 stationAudio.onerror=()=>{status.textContent=b.errorText;sync()};
 button.onclick=async()=>{if(!stationAudio.paused){stationAudio.pause();return}try{await stationAudio.play();status.textContent=''}catch(_){status.textContent=b.errorText;sync()}};
 document.getElementById('bgmVolume').oninput=e=>stationAudio.volume=Number(e.target.value);
}
// Bracketed chunks are consecutive messages; legacy text stays intact.
function splitMessageBody(value){
 const text=String(value??''), parts=[];let cursor=0;
 for(const match of text.matchAll(/\[([^\[\]]*)\]/g)){
  const before=text.slice(cursor,match.index).trim();if(before)parts.push(before);
  if(match[1].trim())parts.push(match[1].trim());
  cursor=match.index+match[0].length;
 }
 const tail=text.slice(cursor).trim();if(tail)parts.push(tail);
 return parts.length?parts:[text];
}
let chatTimer=null;
function renderMessages(){
 clearTimeout(chatTimer);
 const m=config.messages,root=document.getElementById('messageWidget');root.hidden=!m.enabled;
 const messages=m.items.map(x=>{
  const parts=splitMessageBody(x.body),right=x.side==='right',avatar=ArchiveConfig.image(m[right?'rightAvatar':'leftAvatar']);
  return `<article hidden class="chat-message ${right?'chat-outgoing':'chat-incoming'}"><span class="chat-avatar" aria-hidden="true">${avatar?`<img src="${escapeHTML(avatar)}" alt="" loading="lazy">`:escapeHTML(Array.from(x.sender|| (right?'D':'J'))[0])}</span><div class="chat-stack"><b class="chat-sender">${escapeHTML(x.sender)}</b>${parts.map(body=>`<div hidden class="message-bubble ${right?'from-right':''}"><p>${nl(body)}</p></div>`).join('')}${x.time?`<span hidden class="chat-time">${escapeHTML(x.time)}</span>`:''}</div></article>`;
 }).join('');
 root.innerHTML=`<header class="chat-heading"><span class="chat-pair-mark" aria-hidden="true"><i></i><i></i></span><div><span class="chat-channel">PRIVATE FREQUENCY / 0305</span><h3>${escapeHTML(m.title)}</h3></div><button type="button" class="chat-close" aria-label="대화 기록 닫기">×</button></header><p class="message-subtitle">${escapeHTML(m.subtitle)}</p><div class="message-log" tabindex="0" aria-label="${escapeHTML(m.title)}"><div class="chat-divider"><span>TRANSMISSION ARCHIVE</span></div>${messages||`<p class="empty-message">${escapeHTML(m.emptyText)}</p>`}<div class="chat-typing" hidden aria-label="메시지를 기다리는 중"><i></i><i></i><i></i></div></div><footer class="chat-footer"><span aria-hidden="true">◈</span> BETWEEN TWO SIGNALS <span class="chat-footer-line" aria-hidden="true"></span></footer>`;
 root.querySelectorAll('.chat-avatar img').forEach(img=>img.onerror=()=>{img.replaceWith(document.createTextNode('◈'))});
 if(document.getElementById('widgetShelf').open)advanceChat();
 root.querySelector('.chat-close').onclick=()=>{document.getElementById('widgetShelf').open=false;document.getElementById('widgetSummary').focus()};
}

// Pause on close and continue where the visitor left off, without duplicate timers.
function advanceChat(){
 clearTimeout(chatTimer);
 const root=document.getElementById('messageWidget'),log=root.querySelector('.message-log'),typing=root.querySelector('.chat-typing');
 if(!log||!typing)return;
 const bubble=root.querySelector('.message-bubble[hidden]');
 typing.hidden=true;
 if(!document.getElementById('widgetShelf').open||!bubble)return;
 const row=bubble.closest('.chat-message');
 typing.classList.toggle('typing-right',row.classList.contains('chat-outgoing'));typing.hidden=false;
 if(log.scrollHeight-log.scrollTop-log.clientHeight<80)log.scrollTop=log.scrollHeight;
 chatTimer=setTimeout(()=>{
  if(!document.getElementById('widgetShelf').open){typing.hidden=true;return}
  const follow=log.scrollHeight-log.scrollTop-log.clientHeight<80;
  typing.hidden=true;row.hidden=false;bubble.hidden=false;
  if(!row.querySelector('.message-bubble[hidden]')){const time=row.querySelector('.chat-time');if(time)time.hidden=false}
  if(follow)log.scrollTop=log.scrollHeight;
  advanceChat();
 },1100);
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
 document.getElementById('widgetShelf').inert=open;
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

const floatingShelf=document.getElementById('widgetShelf');
floatingShelf.addEventListener('toggle',()=>{if(floatingShelf.open)advanceChat();else{clearTimeout(chatTimer);const typing=document.querySelector('.chat-typing');if(typing)typing.hidden=true}});
floatingShelf.addEventListener('keydown',event=>{if(event.key==='Escape'){floatingShelf.open=false;document.getElementById('widgetSummary').focus()}});
document.addEventListener('pointerdown',event=>{if(floatingShelf.open&&!floatingShelf.contains(event.target))floatingShelf.open=false});

function renderLinkSonar(p){
 const items=p.items||[];
 return `<section class="link-observatory"><div class="link-observatory-head"><span>${escapeHTML(config.hud.linksTitle)}</span><span>${String(items.length).padStart(2,'0')} / SIGNALS</span></div>${p.description?`<p class="link-intro">${nl(p.description)}</p>`:''}<div class="link-sonar-layout"><div class="sonar-console"><div class="link-sonar" role="group" aria-label="링크 관측점"><div class="sonar-sweep" aria-hidden="true"></div><div class="sonar-cross" aria-hidden="true"></div><span class="sonar-north" aria-hidden="true">N</span><span class="sonar-south" aria-hidden="true">S</span><i class="sonar-core" aria-hidden="true"></i><div id="linkPoints"></div></div><div class="sonar-pagination"><button id="sonarPrevious" type="button" aria-label="이전 관측점">←</button><span id="sonarPage"></span><button id="sonarNext" type="button" aria-label="다음 관측점">→</button></div></div><section id="linkContact" class="link-contact" aria-live="polite" aria-atomic="true"></section></div></section>`;
}
function bindLinkSonar(p){
 if(p.type!=='links')return;
 const items=p.items||[],perPage=8,total=Math.max(1,Math.ceil(items.length/perPage));let page=0,selected=-1;
 const positions=[[36,30],[72,28],[25,68],[65,78],[50,15],[83,53],[45,84],[17,45]];
 const contact=document.getElementById('linkContact');
 function select(index){
  selected=index;document.querySelectorAll('[data-contact]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.contact===index)));
  const x=items[index];if(x._sealed){contact.innerHTML=ArchiveLocks.card(index);if(matchMedia('(max-width:1000px)').matches)contact.scrollIntoView({block:'nearest',behavior:'instant'});return}const url=ArchiveConfig.link(x.url);
  contact.innerHTML=`<div class="contact-heading"><span class="contact-pulse" aria-hidden="true"></span><span>CONTACT / ${String(index+1).padStart(2,'0')}</span></div>${x.image?`<img class="contact-image" src="${escapeHTML(ArchiveConfig.image(x.image))}" alt="${escapeHTML(x.title||'')}">`:''}<h3>${escapeHTML(x.title||'LINK')}</h3><p>${nl(x.description||'')}</p>${url!=='#'?`<a class="contact-open" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(config.hud.linkOpen)} <span aria-hidden="true">↗</span></a>`:`<span class="contact-unavailable">${escapeHTML(config.hud.linkUnavailable)}</span>`}`;
  if(matchMedia('(max-width:1000px)').matches)contact.scrollIntoView({block:'nearest',behavior:'instant'});
 }
 function render(){
  const start=page*perPage;
  document.getElementById('linkPoints').innerHTML=items.slice(start,start+perPage).map((x,i)=>`<button type="button" class="sonar-point ${i%2?'sky':'amber'}" data-contact="${start+i}" style="left:${positions[i][0]}%;top:${positions[i][1]}%" aria-label="${escapeHTML(x.title||'LINK')}" aria-controls="linkContact" aria-pressed="${selected===start+i}"><i aria-hidden="true"></i><span aria-hidden="true">${String(start+i+1).padStart(2,'0')}</span></button>`).join('');
  document.querySelectorAll('[data-contact]').forEach(b=>b.onclick=()=>select(+b.dataset.contact));
  document.getElementById('sonarPage').textContent=String(page+1).padStart(2,'0')+' / '+String(total).padStart(2,'0');
  document.getElementById('sonarPrevious').disabled=page===0;document.getElementById('sonarNext').disabled=page===total-1;
  document.getElementById('sonarPrevious').hidden=total===1;document.getElementById('sonarNext').hidden=total===1;
 }
 contact.innerHTML=`<div class="contact-idle" aria-hidden="true">◎</div><p>${escapeHTML(items.length?config.hud.linkPrompt:config.hud.linkEmpty)}</p>`;
 document.getElementById('sonarPrevious').onclick=()=>{page--;render();document.querySelector('[data-contact]')?.focus()};
 document.getElementById('sonarNext').onclick=()=>{page++;render();document.querySelector('[data-contact]')?.focus()};
 render();
}

function bindPromptCopy(p){
 if(p.type!=='prompts')return;
 document.querySelectorAll('[data-copy-prompt]').forEach(button=>button.onclick=async()=>{
  const text=String(p.items?.[+button.dataset.copyPrompt]?.prompt||''),card=button.closest('.prompt-card'),status=card.querySelector('.prompt-status');
  if(!text){status.textContent='복사할 내용이 없습니다.';return}
  try{await navigator.clipboard.writeText(text);status.textContent='복사했어요.';alert('복사했습니다');}
  catch(_){if(card.querySelector('.prompt-codebox')){let fallback=card.querySelector('.prompt-copy-fallback');if(!fallback){fallback=document.createElement('textarea');fallback.className='prompt-copy-fallback';fallback.readOnly=true;fallback.setAttribute('aria-label','전체 프롬프트 원문 복사');card.append(fallback)}fallback.value=text;fallback.focus();fallback.select()}else{const selection=window.getSelection(),range=document.createRange();range.selectNodeContents(card.querySelector('.prompt-text'));selection.removeAllRanges();selection.addRange(range)}status.textContent='본문을 선택했어요. 복사 메뉴 또는 Ctrl/Cmd+C를 사용해 주세요.'}
 });
}
// Discourage casual image saving; public images remain downloadable over the network.
function protectedPhoto(target){return target instanceof Element&&target.closest('#archive img,#entrance img,.image-slot,.subject-image,.vhs-screen')}
for(const type of ['contextmenu','dragstart'])document.addEventListener(type,event=>{if(config.decor.protectImages&&protectedPhoto(event.target))event.preventDefault()});

document.addEventListener('submit',async event=>{
 const form=event.target.closest('[data-unlock-item],[data-unlock-page]');if(!form)return;event.preventDefault();
 const p=config.pages.find(x=>x.id===document.getElementById('pageContent').dataset.pageId);if(!p)return;
 const page=form.hasAttribute('data-unlock-page'),index=+form.dataset.unlockItem,target=page?p:p.items[index];
 const value=await ArchiveLocks.unlockInline(target,page?ArchiveLocks.pageKey(p):ArchiveLocks.itemKey(target),form);if(!value)return;
 if(page)config.pages[config.pages.indexOf(p)]=value;else p.items[index]=value;showPage(p.id);document.getElementById('pageTitle').focus({preventScroll:true});
});

function renderPromptContent(raw){
 const text=String(raw||'');if(!text.includes('```')&&!/^\[.+\]$/m.test(text))return `<pre class="prompt-text" tabindex="0">${escapeHTML(text)}</pre>`;
 const lines=text.replace(/\r/g,'').split('\n');let html='',prose=[];
 const flush=()=>{if(prose.length){html+=`<div class="prompt-prose">${escapeHTML(prose.join('\n'))}</div>`;prose=[]}};
 for(let i=0;i<lines.length;i++){
  const line=lines[i],trim=line.trim();
  if(trim.startsWith('```')){flush();const label=trim.slice(3).trim()||'PROMPT',body=[];i++;while(i<lines.length&&!lines[i].trim().startsWith('```'))body.push(lines[i++]);html+=`<section class="prompt-codebox"><div class="prompt-codehead"><span>${escapeHTML(label)}</span><button type="button" class="prompt-copy" data-copy-box aria-label="${escapeHTML(label+' 복사')}">COPY</button></div><pre class="prompt-text" tabindex="0">${escapeHTML(body.join('\n'))}</pre><span class="prompt-status" role="status"></span></section>`;continue}
  if(/^\[.+\]$/.test(trim)){flush();html+=`<h4 class="prompt-section-title">${escapeHTML(trim.slice(1,-1))}</h4>`;continue}
  if(/^---+$/.test(trim)){flush();html+='<hr>';continue}prose.push(line);
 }
 flush();return html;
}
document.addEventListener('click',async event=>{
 const button=event.target.closest('[data-copy-box]');if(!button)return;const box=button.closest('.prompt-codebox'),pre=box.querySelector('pre'),status=box.querySelector('.prompt-status');
 try{await navigator.clipboard.writeText(pre.textContent);status.textContent='복사했어요.';alert('복사했습니다');}catch(_){const range=document.createRange();range.selectNodeContents(pre);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);status.textContent='본문을 선택했어요. 복사 메뉴 또는 Ctrl/Cmd+C를 사용해 주세요.'}
});
