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
 text('#backButton',h.returnLabel);text('#widgetSummary',h.widgetTitle);
 text('#archiveStamp',config.decor.stamp);
 const frame=document.querySelector('#archive .frame');
 frame.dataset.decor=config.decor.enabled?'on':'off';frame.dataset.grid=config.decor.grid?'on':'off';frame.dataset.frame=config.decor.frame;
 frame.style.setProperty('--margin-note',JSON.stringify(config.decor.verticalText));
 renderDayWidget();clearInterval(dayTimer);dayTimer=setInterval(renderDayWidget,60000);
 renderBgmWidget();renderMessages();
 document.getElementById('widgetShelf').hidden=!config.bgm.enabled&&!config.messages.enabled;
 document.getElementById('widgetShelf').open=matchMedia('(min-width:1000px)').matches;
}
function renderDayWidget(){
 const root=document.getElementById('dayWidget'),d=config.dayCounter;root.hidden=!d.enabled;if(!d.enabled)return;
 const count=ArchiveConfig.dayInfo(d),days=count.days;
 const max=Math.max(100,Math.ceil(Math.max(days,1)/100)*100),ratio=Math.min(100,days/max*100);
 root.innerHTML=`<div class="instrument-heading">${escapeHTML(d.title)}</div><div class="day-gauge"><div class="day-ruler" aria-hidden="true"><span>0</span><span>${Math.round(max/2)}</span><span>${max}</span><i style="top:${ratio}%"></i></div><div class="day-reading"><div class="day-name">${escapeHTML(d.name)}</div><strong id="dayValue">${count.future?'−':''}${days.toLocaleString('ko-KR')}<small>${escapeHTML(count.future?'':d.unit)}</small></strong><span id="dayDescription">${count.future?escapeHTML(d.futureLabel)+' '+days+'일':days+escapeHTML(d.suffix)}</span><time datetime="${escapeHTML(d.startDate)}">${escapeHTML(d.startDate.replaceAll('-','.'))}</time></div></div>`;
}
function renderBgmWidget(){
 const b=config.bgm,root=document.getElementById('bgmWidget');root.hidden=!b.enabled;
 stationAudio.pause();stationAudio.removeAttribute('src');stationAudio.load();
 const src=b.src?ArchiveConfig.image(b.src):'';
 // Audio paths use the same http(s)/file protocol allowlist; data images are not audio.
 if(src&&!src.startsWith('data:'))stationAudio.src=src;
 stationAudio.volume=b.volume;stationAudio.loop=b.loop;
 root.innerHTML=`<h3>${escapeHTML(b.title)}</h3><p class="track-title">${escapeHTML(b.trackTitle)}</p><div class="bgm-controls"><button id="bgmPlay" type="button" aria-pressed="false" ${src?'':'disabled'}>${escapeHTML(b.playLabel)}</button><label>${escapeHTML(b.volumeLabel)}<input id="bgmVolume" type="range" min="0" max="1" step="0.05" value="${b.volume}" aria-label="${escapeHTML(b.volumeLabel)}"></label></div><p id="bgmStatus" role="status">${src?'':escapeHTML(b.emptyText)}</p>`;
 const button=document.getElementById('bgmPlay'),status=document.getElementById('bgmStatus');
 const sync=()=>{button.textContent=stationAudio.paused?b.playLabel:b.pauseLabel;button.setAttribute('aria-pressed',String(!stationAudio.paused))};
 stationAudio.onplay=sync;stationAudio.onpause=sync;stationAudio.onended=sync;
 stationAudio.onerror=()=>{status.textContent=b.errorText;sync()};
 button.onclick=async()=>{if(!stationAudio.paused){stationAudio.pause();return}try{await stationAudio.play();status.textContent=''}catch(_){status.textContent=b.errorText;sync()}};
 document.getElementById('bgmVolume').oninput=e=>stationAudio.volume=Number(e.target.value);
}
function renderMessages(){
 const m=config.messages,root=document.getElementById('messageWidget');root.hidden=!m.enabled;
 root.innerHTML=`<h3>${escapeHTML(m.title)}</h3><p class="message-subtitle">${escapeHTML(m.subtitle)}</p><div class="message-log" tabindex="0" aria-label="${escapeHTML(m.title)}">${m.items.length?m.items.map(x=>`<article class="message-bubble ${x.side==='right'?'from-right':''}"><header><b>${escapeHTML(x.sender)}</b><span>${escapeHTML(x.time)}</span></header><p>${nl(x.body)}</p></article>`).join(''):`<p class="empty-message">${escapeHTML(m.emptyText)}</p>`}</div>`;
}
