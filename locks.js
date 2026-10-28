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
 function ask(box,title,required=false){
  return new Promise((resolve,reject)=>{
   const dialog=document.createElement('dialog');dialog.className='archive-lock-dialog';dialog.innerHTML=`<form><span class="lock-kicker">PRIVATE ARCHIVE</span><h2>${esc(title)}</h2><p>비밀번호를 입력하면 잠긴 기록을 열 수 있어요.</p><label>비밀번호<input type="password" autocomplete="current-password" required></label><p class="lock-status" role="status"></p><div class="lock-actions"><button type="submit">기록 열기</button>${required?'':'<button type="button" data-cancel>취소</button>'}</div></form>`;
   document.body.append(dialog);const input=dialog.querySelector('input'),status=dialog.querySelector('.lock-status'),submit=dialog.querySelector('[type=submit]');
   const close=()=>{dialog.close();dialog.remove()};
   dialog.addEventListener('cancel',e=>{e.preventDefault();if(!required){close();resolve(null)}});
   dialog.querySelector('[data-cancel]')?.addEventListener('click',()=>{close();resolve(null)});
   dialog.querySelector('form').onsubmit=async e=>{e.preventDefault();submit.disabled=true;status.textContent='기록을 여는 중…';try{const password=input.value,value=await unseal(box,password);close();resolve({value,password})}catch(err){status.textContent=crypto?.subtle?'비밀번호가 다르거나 파일이 손상되었어요. 다시 확인해 주세요.':err.message;input.focus();input.select()}finally{submit.disabled=false}};
   dialog.showModal();input.focus();
  });
 }
 function pageKey(p){return 'page:'+p.id}
 function itemKey(item){item._lockId ||=crypto.randomUUID?crypto.randomUUID():Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');return 'item:'+item._lockId}
 function editor(key){const on=passwords.has(key);return `<details class="lock-editor"><summary>비밀번호 · ${on?'설정됨':'없음'}</summary><p>새 비밀번호는 8자 이상으로 입력해 주세요. 잊으면 복구할 수 없어요.</p><label>새 비밀번호<input type="password" autocomplete="new-password" data-lock-password="${esc(key)}"></label><label>비밀번호 확인<input type="password" autocomplete="new-password" data-lock-confirm="${esc(key)}"></label><div class="lock-actions"><button type="button" class="btn" data-lock-apply="${esc(key)}">설정 / 변경</button><button type="button" class="btn" data-lock-remove="${esc(key)}">비밀번호 해제</button></div><p class="lock-status" role="status"></p></details>`}
 function bind(root){root.querySelectorAll('[data-lock-apply]').forEach(button=>button.onclick=()=>{const panel=button.closest('.lock-editor'),password=panel.querySelector('[data-lock-password]').value,confirm=panel.querySelector('[data-lock-confirm]').value,status=panel.querySelector('.lock-status');if(password.length<8||password!==confirm){status.textContent='8자 이상으로 입력하고 두 비밀번호를 같게 맞춰 주세요.';return}passwords.set(button.dataset.lockApply,password);panel.querySelector('summary').textContent='비밀번호 · 설정됨';panel.querySelectorAll('input').forEach(x=>x.value='');status.textContent='설정했어요. 저장 또는 내보내기 때 암호화됩니다.'});root.querySelectorAll('[data-lock-remove]').forEach(button=>button.onclick=()=>{passwords.delete(button.dataset.lockRemove);button.closest('.lock-editor').querySelector('summary').textContent='비밀번호 · 없음';button.closest('.lock-editor').querySelector('.lock-status').textContent='잠금을 해제했어요. 저장 또는 내보내기로 반영하세요.'})}
 async function openSite(raw){if(raw?.archiveEncrypted!==1)return raw;const result=await ask(raw.payload,'황혼기록 · 비공개 홈페이지',true);passwords.set('site',result.password);return result.value}
 async function unlock(target,key,remember=false){const result=await ask(target._sealed,'잠긴 기록');if(!result)return null;if(remember)passwords.set(key,result.password);return result.value}
 async function protect(config){
  const c=structuredClone(config);
  for(const p of c.pages){if(p._sealed)continue;
   if(p.items)for(let i=0;i<p.items.length;i++){const x=p.items[i],k=x._lockId?'item:'+x._lockId:null;if(!x._sealed&&passwords.has(k)){p.items[i]={_lockId:x._lockId,title:'잠긴 기록',_sealed:await seal(x,passwords.get(k))}}}
   const k=pageKey(p);if(passwords.has(k)){const index=c.pages.indexOf(p);c.pages[index]={id:p.id,nav:p.nav,title:'잠긴 기록',type:'locked',_sealed:await seal(p,passwords.get(k))}}
  }
  return passwords.has('site')?{archiveEncrypted:1,payload:await seal(c,passwords.get('site'))}:c;
 }
 function card(index,kind='item'){return `<section class="locked-record"><span aria-hidden="true">◇</span><h3>잠긴 기록</h3><p>비밀번호를 입력하면 내용을 볼 수 있어요.</p><button type="button" data-unlock-${kind}="${index}">기록 열기</button><span role="status" class="lock-status"></span></section>`}
 function finishBoot(){document.body.classList.remove('boot-pending');document.getElementById('bootStatus')?.remove()}
 function bootError(error){const el=document.getElementById('bootStatus');if(el)el.textContent='기록을 열지 못했어요. 파일을 확인하고 새로고침해 주세요. '+error.message}
 async function importConfig(raw,defaults){const previous=new Map(passwords);passwords.clear();try{return ArchiveConfig.normalize(await openSite(raw),defaults)}catch(error){passwords.clear();for(const [k,v] of previous)passwords.set(k,v);throw error}}
 return {importConfig,seal,unseal,openSite,unlock,protect,pageKey,itemKey,editor,bind,card,finishBoot,bootError,reset:()=>passwords.clear()};
})();
