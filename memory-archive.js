function renderLogText(value){
 const text=String(value||''),quotes=/“[^”]*”|「[^」]*」|『[^』]*』|"[^"\n]+"/gu;let result='',last=0;
 for(const match of text.matchAll(quotes)){result+=nl(text.slice(last,match.index));const start=text.lastIndexOf('\n',match.index-1)+1,end=text.indexOf('\n',match.index+match[0].length);const ownLine=text.slice(start,match.index).trim()===''&&text.slice(match.index+match[0].length,end<0?text.length:end).trim()==='';result+=`<span class="log-dialogue${ownLine?' log-dialogue-line':''}">${nl(match[0])}</span>`;last=match.index+match[0].length}return result+nl(text.slice(last));
}
function renderMemoryArchive(page){
 const items=page.items||[];
 return `${page.quote?`<section class="card"><div class="eyebrow">${escapeHTML(config.hud.fragmentLabel)}</div><div class="quote">${nl(page.quote)}</div></section>`:''}<div class="memory-directory"><header class="memory-group-heading"><div><span>ARCHIVE LOG</span><h3>${escapeHTML(page.listTitle??'로그 목록')}</h3></div><small>${items.length} RECORDS</small></header>${items.map((item,index)=>item._sealed?ArchiveLocks.card(index):`<details class="memory-entry"><summary><span class="memory-number">${String(index+1).padStart(2,'0')}</span><span class="memory-entry-title">${escapeHTML(item.title||'제목 없는 기록')}</span><span class="memory-open-mark" aria-hidden="true">+</span></summary><div class="memory-entry-body">${item.date?`<time>${escapeHTML(item.date)}</time>`:''}<div class="memory-log-text">${renderLogText(item.description)}</div>${item.image?`<img class="user-image" src="${escapeHTML(ArchiveConfig.image(item.image))}" alt="${escapeHTML(item.title||'')}" loading="lazy">`:''}</div></details>`).join('')}${!items.length?'<p class="memory-empty">아직 등록된 기록이 없습니다.</p>':''}</div>`;
}
async function copyArchiveText(text,root,status){try{await navigator.clipboard.writeText(text);status.textContent='복사했습니다.'}catch(_){let input=root.querySelector('.archive-copy-fallback');if(!input){input=document.createElement('textarea');input.className='archive-copy-fallback';input.readOnly=true;input.setAttribute('aria-label','복사할 원문');root.append(input)}input.value=text;input.focus();input.select();status.textContent='선택된 내용을 Ctrl/Cmd+C 또는 복사 메뉴로 복사해 주세요.'}}
function bindArchiveTools(page){

 let tools=document.getElementById('categoryShareTools');
 if(page.type!=='prompts'&&!(page._sealed&&page.id==='prompts')){tools?.remove();return}
 if(!tools){tools=document.createElement('div');tools.id='categoryShareTools';tools.innerHTML='<button type="button" class="category-link-copy" aria-label="현재 카테고리 링크 복사" title="카테고리 링크 복사"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 14 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 10a4 4 0 0 0 6 0l4-4a4 4 0 0 0-6-6l-1 1"/></svg></button><span role="status" class="category-copy-status"></span>';document.querySelector('.content-head').after(tools)}
 tools.querySelector('[role=status]').textContent='';tools.querySelector('.archive-copy-fallback')?.remove();
 tools.querySelector('button').onclick=()=>{const url=new URL(location.href);url.searchParams.delete('preview');url.hash=new URLSearchParams({page:page.id}).toString();copyArchiveText(url.href,tools,tools.querySelector('[role=status]'))};
}
function archivePageFromHash(){return new URLSearchParams(location.hash.slice(1)).get('page')}
window.addEventListener('hashchange',()=>{if(typeof config!=='undefined'&&config.pages)showPage(archivePageFromHash()||config.pages[0]?.id)});
