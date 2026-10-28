/* Passwords remain in memory. Published payloads use authenticated encryption. */
window.ArchiveLocks=(()=>{
 const passwords=new Map(),encoder=new TextEncoder(),decoder=new TextDecoder();
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const base64=b=>{let s='';for(let i=0;i<b.length;i+=8192)s+=String.fromCharCode(...b.subarray(i,i+8192));return btoa(s)};
 const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
 function available(){if(!crypto?.subtle)throw Error('비밀번호 기능은 HTTPS 또는 localhost에서 사용할 수 있어요.')}
 async function key(password,salt,iterations){available();const raw=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations},raw,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
 async function seal(value,password){const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),iterations=310000,k=await key(password,salt,iterations);const data=await crypto.subtle.encrypt({name:'AES-GCM',iv},k,encoder.encode(JSON.stringify(value)));return {version:1,kdf:'PBKDF2-SHA256',cipher:'AES-256-GCM',iterations,salt:base64(salt),iv:base64(iv),data:base64(new Uint8Array(data))}}
 async function unseal(box,password){if(box?.version!==1||box.kdf!=='PBKDF2-SHA256'||box.cipher!=='AES-256-GCM'||box.iterations!==310000)throw Error('지원하지 않는 암호화 형식입니다.');const salt=bytes(box.salt),iv=bytes(box.iv);if(salt.length!==16||iv.length!==12)throw Error('암호화 데이터가 손상되었습니다.');const k=await key(password,salt,box.iterations);return JSON.parse(decoder.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv},k,bytes(box.data))))}
 function formMarkup(attributes=''){return `<form class="archive-unlock-form" ${attributes}><label>비밀번호<input type="password" autocomplete="current-password" required placeholder="기록의 비밀번호" aria-label="기록 비밀번호"></label><button type="submit" aria-label="기록 열기">열기 <span aria-hidden="true">↗</span></button><p class="lock-status" role="status"></p></form>`}
 async function unlockInline(target,key,form,remember=false){
  if(form.getAttribute('aria-busy')==='true')return null;
  const input=form.querySelector('input'),button=form.querySelector('button'),status=form.querySelector('.lock-status');
  form.setAttribute('aria-busy','true');button.disabled=true;status.textContent='기록을 여는 중…';
  try{const password=input.value,value=await unseal(target._sealed,password);if(!form.isConnected)return null;if(remember)passwords.set(key,password);input.value='';return value}
  catch(error){if(form.isConnected){status.textContent=crypto?.subtle?'비밀번호가 다르거나 파일이 손상되었어요. 다시 확인해 주세요.':error.message;input.focus({preventScroll:true});input.select()}return null}
  finally{form.removeAttribute('aria-busy');button.disabled=false}
 }
 function siteGate(box){return new Promise(resolve=>{
  let gate=document.getElementById('bootStatus');if(!gate){gate=document.createElement('section');gate.id='bootStatus';document.body.prepend(gate)}
  document.body.classList.add('boot-pending');gate.className='site-access-gate';gate.removeAttribute('role');
  gate.innerHTML=`<div class="gate-layout"><div class="gate-caption">THE TWILIGHT ARCHIVE <span>PRIVATE TAPE / 0305</span></div><h1>황혼기록</h1><div class="gate-tv"><div class="gate-screen"><div class="gate-screen-meta"><span>● REC / STANDBY</span><span>03:05</span></div><div class="gate-horizon" aria-hidden="true"><i></i></div><div class="gate-screen-copy"><span>TWILIGHT ↔ DEEP SEA</span><h2>아직 열리지 않은 기억</h2><p>비밀번호를 입력하면 회상이 시작됩니다.</p></div>${formMarkup('data-site-unlock')}<div class="gate-screen-bottom" aria-hidden="true">MEMORY LOCKED ───────── SIGNAL WAITING</div></div><div class="gate-hardware" aria-hidden="true"><i></i><i></i><span></span></div></div><div class="gate-foot">SOME MEMORIES NEVER REACH THE SURFACE.</div></div>`;
  const form=gate.querySelector('form');form.onsubmit=async event=>{event.preventDefault();const value=await unlockInline({_sealed:box},'site',form,true);if(value){gate.remove();document.body.classList.remove('boot-pending');resolve(value)}};
 });}
 function pageKey(p){return 'page:'+p.id}
 function itemKey(item){item._lockId ||=crypto.randomUUID?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');return 'item:'+item._lockId}
 function editor(key){const on=passwords.has(key);return `<details class="lock-editor"><summary>비밀번호 · ${on?'설정됨':'없음'}</summary><p>새 비밀번호는 8자 이상으로 입력해 주세요. 잊으면 복구할 수 없어요.</p><label>새 비밀번호<input type="password" autocomplete="new-password" data-lock-password="${esc(key)}"></label><label>비밀번호 확인<input type="password" autocomplete="new-password" data-lock-confirm="${esc(key)}"></label><div class="lock-actions"><button type="button" class="btn" data-lock-apply="${esc(key)}">설정 / 변경</button><button type="button" class="btn" data-lock-remove="${esc(key)}">비밀번호 해제</button></div><p class="lock-status" role="status"></p></details>`}
 function bind(root){root.querySelectorAll('[data-lock-apply]').forEach(button=>button.onclick=()=>{const panel=button.closest('.lock-editor'),password=panel.querySelector('[data-lock-password]').value,confirm=panel.querySelector('[data-lock-confirm]').value,status=panel.querySelector('.lock-status');if(password.length<8||password!==confirm){status.textContent='8자 이상으로 입력하고 두 비밀번호를 같게 맞춰 주세요.';return}passwords.set(button.dataset.lockApply,password);panel.querySelector('summary').textContent='비밀번호 · 설정됨';panel.querySelectorAll('input').forEach(x=>x.value='');status.textContent='설정했어요. 저장 또는 내보내기 때 암호화됩니다.'});root.querySelectorAll('[data-lock-remove]').forEach(button=>button.onclick=()=>{passwords.delete(button.dataset.lockRemove);button.closest('.lock-editor').querySelector('summary').textContent='비밀번호 · 없음';button.closest('.lock-editor').querySelector('.lock-status').textContent='잠금을 해제했어요. 저장 또는 내보내기로 반영하세요.'})}
 async function openSite(raw){if(raw?.archiveEncrypted!==1)return raw;return siteGate(raw.payload)}
 async function protect(config){
  const c=structuredClone(config);
  for(const p of c.pages){if(p._sealed)continue;
   if(p.items)for(let i=0;i<p.items.length;i++){const x=p.items[i],k=x._lockId?'item:'+x._lockId:null;if(!x._sealed&&passwords.has(k)){p.items[i]={_lockId:x._lockId,title:'잠긴 기록',_sealed:await seal(x,passwords.get(k))}}}
   const k=pageKey(p);if(passwords.has(k)){const index=c.pages.indexOf(p);c.pages[index]={id:p.id,nav:p.nav,title:'잠긴 기록',type:'locked',_sealed:await seal(p,passwords.get(k))}}
  }
  return passwords.has('site')?{archiveEncrypted:1,payload:await seal(c,passwords.get('site'))}:c;
 }
 function card(index,kind='item'){return `<section class="locked-record"><div class="lock-record-meta"><span>PRIVATE RECORD</span><span>◇ LOCKED</span></div><div class="lock-record-copy"><i aria-hidden="true">◈</i><div><h3>아직 열리지 않은 기록</h3><p>비밀번호를 입력해 이야기를 이어 주세요.</p></div></div>${formMarkup(`data-unlock-${kind}="${index}"`)}</section>`}
 function finishBoot(){document.body.classList.remove('boot-pending');document.getElementById('bootStatus')?.remove()}
 function bootError(error){const el=document.getElementById('bootStatus');if(el)el.textContent='기록을 열지 못했어요. 파일을 확인하고 새로고침해 주세요. '+error.message}
 async function importConfig(raw,defaults){const previous=new Map(passwords);passwords.clear();try{return ArchiveConfig.normalize(await openSite(raw),defaults)}catch(error){passwords.clear();for(const [k,v] of previous)passwords.set(k,v);throw error}}
 return {importConfig,seal,unseal,openSite,unlockInline,protect,pageKey,itemKey,editor,bind,card,finishBoot,bootError,reset:()=>passwords.clear()};
})();
