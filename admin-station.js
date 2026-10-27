const stationLabels={enabled:'표시하기',startDate:'시작 날짜',startAtOne:'시작일을 1일째로 계산',title:'제목',name:'기념일 이름',unit:'수심 단위',suffix:'날짜 뒤 문구',futureLabel:'시작 전 문구',timezone:'날짜 계산 시간대',trackTitle:'곡 이름',src:'음악 파일 경로 / HTTPS 주소',volume:'기본 음량 (0–1)',loop:'반복 재생',emptyText:'비어 있을 때 문구',playLabel:'재생 버튼 문구',pauseLabel:'정지 버튼 문구',volumeLabel:'음량 문구',errorText:'재생 오류 문구',subtitle:'설명',grid:'좌표 격자 표시',stamp:'기록 스탬프',verticalText:'여백 세로 문구',frame:'프레임',resonanceTitle:'공명계 제목',pairLabel:'페어 연결 문구',channelLabel:'채널 설명',channel:'채널 표시',resonanceCaption:'공명 설명',pairCaption:'페어 상징 문구',echoTitle:'파형 제목',echoChannel:'파형 채널',signalOne:'첫 번째 신호 이름',signalTwo:'두 번째 신호 이름',station:'관측소 표기',coordinates:'좌표',connection:'연결 상태 문구',endTitle:'기록 끝 제목',endNote:'기록 끝 문구',widgetTitle:'위젯 열기 문구',quoteLabel:'인용문 위 설명',subjectsAction:'인물 기록 버튼',memoryAction:'기억 기록 버튼',emptyImage:'사진 없는 자리 문구',recordLabel:'사진 설명',eventsTitle:'타임라인 제목',fragmentLabel:'발췌 표기',linksTitle:'외부 링크 제목',returnLabel:'대문으로 돌아가기 문구'};
function renderStationSettings(){
 const root=document.getElementById('stationSettings');
 root.innerHTML=Object.entries({dayCounter:'수심계 · 디데이',bgm:'배경음악',messages:'대화 기록',decor:'발췌 사이트에서 가져온 장식',hud:'계기와 화면 문구'}).map(([section,title])=>`<section class="item-editor"><h3>${title}</h3>${section==='bgm'?'<p class="hint">예: music/theme.mp3. 음악 파일도 같은 사이트에 업로드하세요. 방문자가 재생을 눌러야 소리가 납니다. JSON에는 음악 파일 대신 경로가 저장됩니다.</p>':''}${section==='messages'?'<p class="hint">관리자가 편집해 공개하는 교신 기록입니다. 실제 메시지를 전송하거나 비공개 대화를 저장하지 않습니다.</p>':''}<div class="fields">${Object.entries(cfg[section]).filter(([key,value])=>key!=='items'&&['string','boolean','number'].includes(typeof value)).map(([key,value])=>{
 const path=section+'.'+key,label=stationLabels[key]||key;
 if(key==='frame')return `<div class="field"><label>${label}<select data-path="${path}">${['double','line','dashed'].map(x=>`<option ${value===x?'selected':''} value="${x}">${({double:'이중선',line:'선',dashed:'점선'})[x]}</option>`).join('')}</select></label></div>`;
 if(typeof value==='boolean')return `<div class="field"><label><input type="checkbox" data-path="${path}" ${value?'checked':''}> ${label}</label></div>`;
 return `<div class="field"><label>${label}<input type="${key==='startDate'?'date':typeof value==='number'?'number':'text'}" data-path="${path}" value="${esc(value)}" ${key==='volume'?'min="0" max="1" step="0.05"':''}></label></div>`;
 }).join('')}</div>${section==='messages'?'<div id="messageEditors"></div><button class="btn" id="addMessage">+ 메시지 추가</button>':''}</section>`).join('');
 bindFields(root);renderMessageEditors();document.getElementById('addMessage').onclick=()=>{cfg.messages.items.push({sender:'',body:'',time:'',side:'left'});renderMessageEditors();renderJson()};
}
function renderMessageEditors(){
 const root=document.getElementById('messageEditors');if(!root)return;
 root.innerHTML=cfg.messages.items.map((x,i)=>`<div class="item-editor"><div class="item-head">교신 ${i+1}<div class="actions"><button class="btn" data-message-move="${i}" data-dir="-1" ${i===0?'disabled':''}>↑</button><button class="btn" data-message-move="${i}" data-dir="1" ${i===cfg.messages.items.length-1?'disabled':''}>↓</button><button class="btn" data-message-delete="${i}">삭제</button></div></div><div class="fields"><label>발신자<input type="text" data-path="messages.items.${i}.sender" value="${esc(x.sender)}"></label><label>날짜 / 시간<input type="text" data-path="messages.items.${i}.time" value="${esc(x.time)}"></label><label>배치<select data-path="messages.items.${i}.side"><option value="left" ${x.side!=='right'?'selected':''}>왼쪽 · 황혼</option><option value="right" ${x.side==='right'?'selected':''}>오른쪽 · 심해</option></select></label><label class="field full">메시지<textarea data-path="messages.items.${i}.body">${esc(x.body)}</textarea></label></div></div>`).join('');
 bindFields(root);
 root.querySelectorAll('[data-message-move]').forEach(b=>b.onclick=()=>{const i=+b.dataset.messageMove,j=i+(+b.dataset.dir);[cfg.messages.items[i],cfg.messages.items[j]]=[cfg.messages.items[j],cfg.messages.items[i]];renderMessageEditors();renderJson()});
 root.querySelectorAll('[data-message-delete]').forEach(b=>b.onclick=()=>{if(confirm('이 교신 기록을 삭제할까요?')){cfg.messages.items.splice(+b.dataset.messageDelete,1);renderMessageEditors();renderJson()}});
}
function newPageItem(type){
 const common={title:'새 기록',description:'',image:''};
 if(type==='timeline')return {date:'',...common};if(type==='subjects')return {eyebrow:'',...common,subtitle:''};if(type==='links')return {...common,url:''};return common;
}
function changePageOrder(dir){const i=cfg.pages.findIndex(x=>x.id===document.getElementById('pageSelect').value),j=i+dir;if(j<0||j>=cfg.pages.length)return;[cfg.pages[i],cfg.pages[j]]=[cfg.pages[j],cfg.pages[i]];buildPageSelect();renderJson()}
document.getElementById('pageUp').onclick=()=>changePageOrder(-1);
document.getElementById('pageDown').onclick=()=>changePageOrder(1);
document.getElementById('deletePage').onclick=()=>{if(cfg.pages.length<=1||!confirm('이 카테고리와 안의 기록을 삭제할까요?'))return;cfg.pages=cfg.pages.filter(x=>x.id!==document.getElementById('pageSelect').value);buildPageSelect();renderJson()};
document.getElementById('addPage').onclick=()=>{
 const type=document.getElementById('newPageType').value;
 const template=structuredClone(DEFAULT_CONFIG.pages.find(p=>p.type===type)||{type,title:'새 카테고리',description:'',items:[]});
 template.id='page-'+Date.now().toString(36);template.nav='새 카테고리';template.title='새 카테고리';if(template.items)template.items=[];
 cfg.pages.push(template);buildPageSelect();document.getElementById('pageSelect').value=template.id;renderPageFields();renderJson();
};
