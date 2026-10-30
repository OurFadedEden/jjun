/* Upload each pose as one image or a sequence, plus optional full-canvas layers. */
let petEditorCharacter='jaejun',petEditorState='idle',petPreviewFrame=0;
function renderPetEditor(){
 cancelAnimationFrame(petPreviewFrame);
 const root=document.getElementById('petSpriteEditor');if(!root)return;
 cfg.pets.characters??={};
 root.innerHTML='<h4>동작별 그림 · 2D 시메지</h4><p class="hint">가만히 있기·앉기·걷기·찡그리기 등 동작마다 다른 그림을 넣어 주세요. 여러 장을 넣으면 등록 순서대로 재생됩니다. 비어 있는 동작은 기본 그림을 사용합니다.</p><div class="fields"><label>캐릭터<select id="petCharacter"><option value="jaejun">재준 · 흑표범</option><option value="dojun">도준 · 흰토끼</option></select></label><label>동작<select id="petAction">'+Object.entries(PetArt.states).map(([key,label])=>`<option value="${key}">${label}</option>`).join('')+'</select></label></div><div id="petActionEditor"></div>';
 const who=root.querySelector('#petCharacter'),action=root.querySelector('#petAction');who.value=petEditorCharacter;action.value=petEditorState;
 who.onchange=()=>{petEditorCharacter=who.value;renderPetActionEditor()};action.onchange=()=>{petEditorState=action.value;renderPetActionEditor()};renderPetActionEditor();
}
function renderPetActionEditor(){
 cancelAnimationFrame(petPreviewFrame);
 const root=document.getElementById('petActionEditor'),id=petEditorCharacter,key=petEditorState;
 cfg.pets.characters[id]??={actions:{}};cfg.pets.characters[id].actions??={};
 const a=cfg.pets.characters[id].actions[key]??={frames:[],fps:6,layers:{}};
 if(!Array.isArray(a.frames))a.frames=[];a.fps??=6;a.layers??={};
 for(const name of ['tail','ears'])a.layers[name]={image:'',pivotX:50,pivotY:70,swing:8,...a.layers[name]};
 const prefix=`pets.characters.${id}.actions.${key}`;
 root.innerHTML=`<div class="pet-editor-preview"><div id="petPosePreview" aria-label="선택한 동작 미리보기"></div><button type="button" class="btn" id="petPreviewToggle" aria-pressed="true">미리보기 멈추기</button><span class="hint">선택한 동작만 미리 봅니다.</span></div><p class="hint">투명 PNG/WebP 권장 · 한 동작 최대 32장. 모든 그림의 캔버스 크기와 발 위치를 맞추면 흔들림 없이 이어집니다. GIF도 가능하지만 재생 속도는 GIF 자체 설정을 따릅니다.</p><div class="fields"><label>등록한 그림의 초당 프레임 (1–24)<input type="number" min="1" max="24" data-path="${prefix}.fps" value="${esc(a.fps)}"></label><label>그림 추가 · 여러 장 선택 가능<input type="file" id="petFramesUpload" accept="image/png,image/webp,image/gif,image/jpeg" multiple></label></div><p id="petUploadStatus" class="hint" role="status"></p><div class="pet-frame-list">${a.frames.map((f,i)=>`<div class="pet-frame"><img src="${esc(ArchiveConfig.image(typeof f==='string'?f:f.image))}" alt="프레임 ${i+1}"><span>${i+1}</span><div><button type="button" class="btn" data-pet-frame="${i}" data-move="-1" ${i===0?'disabled':''} aria-label="프레임 ${i+1} 앞으로">←</button><button type="button" class="btn" data-pet-frame="${i}" data-move="1" ${i===a.frames.length-1?'disabled':''} aria-label="프레임 ${i+1} 뒤로">→</button><button type="button" class="btn" data-pet-delete="${i}" aria-label="프레임 ${i+1} 삭제">×</button></div></div>`).join('')||'<p class="hint">등록된 그림이 없어요. 기본 도트 동작 세트로 표시됩니다. 기본 세트는 정해진 속도로 재생되고, 춤 속도는 위의 동작 템포를 따릅니다.</p>'}</div><details><summary>귀·꼬리 파츠 따로 움직이기</summary><p class="hint">이 동작의 몸통 프레임에는 움직일 귀·꼬리를 빼고 그려 주세요. 파츠도 몸통과 같은 크기의 투명 캔버스에서 제자리에 그려 올리면 겹쳐집니다. 꼬리는 몸통 뒤, 귀는 앞에 놓입니다. 파츠만 등록하면 적용되지 않으니 몸통 프레임도 함께 넣어 주세요.</p>${['tail','ears'].map(name=>`<section class="item-editor"><h4>${name==='tail'?'꼬리':'귀'} 파츠</h4>${imageField(prefix+'.layers.'+name+'.image','투명 파츠 이미지')}<div class="fields">${[['pivotX','회전 중심 가로 (%)',0,100],['pivotY','회전 중심 세로 (%)',0,100],['swing','흔들림 각도 (0이면 고정)',0,30]].map(([prop,label,min,max])=>`<label>${label}<input type="number" min="${min}" max="${max}" data-path="${prefix}.layers.${name}.${prop}" value="${esc(a.layers[name][prop])}"></label>`).join('')}</div></section>`).join('')}</details>`;
 bindFields(root);
 const preview=PetArt.create(root.querySelector('#petPosePreview'));let art=PetArt.normalize(cfg.pets.characters[id],id),playing=true,elapsed=0,last=0;
 const refresh=()=>{art=PetArt.normalize(cfg.pets.characters[id],id);preview.reset()};
 root.querySelectorAll('[data-path]').forEach(e=>e.addEventListener('input',refresh));
 root.querySelectorAll('[data-image]').forEach(e=>e.addEventListener('change',async event=>{await handleImage(event);refresh()}));
 root.querySelectorAll('[data-preview]').forEach(e=>drawPreview(e.dataset.preview));
 root.querySelectorAll('[data-clear-image]').forEach(e=>e.onclick=()=>{setPath(cfg,e.dataset.clearImage,'');drawPreview(e.dataset.clearImage);renderJson();refresh()});
 root.querySelectorAll('[data-pet-frame]').forEach(e=>e.onclick=()=>{const i=+e.dataset.petFrame,j=i+(+e.dataset.move);[a.frames[i],a.frames[j]]=[a.frames[j],a.frames[i]];renderJson();renderPetActionEditor()});
 root.querySelectorAll('[data-pet-delete]').forEach(e=>e.onclick=()=>{a.frames.splice(+e.dataset.petDelete,1);renderJson();renderPetActionEditor()});
 root.querySelector('#petFramesUpload').onchange=async event=>{
  const input=event.target,files=[...input.files],status=root.querySelector('#petUploadStatus');input.disabled=true;let added=0;const failed=[];
  for(const file of files){if(a.frames.length>=32){failed.push('최대 32장까지 넣을 수 있어요.');break}try{a.frames.push({image:await ArchiveImages.read(file)});added++}catch(error){failed.push(`${file.name}: ${error.message}`)}}
  renderJson();if(petEditorCharacter===id&&petEditorState===key){renderPetActionEditor();document.getElementById('petUploadStatus').textContent=`${added}장 추가했습니다. ${failed.join(' ')}`}else{status.textContent=`${added}장 추가했습니다.`;input.disabled=false}
 };
 const toggle=root.querySelector('#petPreviewToggle');toggle.onclick=()=>{playing=!playing;toggle.setAttribute('aria-pressed',String(playing));toggle.textContent=playing?'미리보기 멈추기':'미리보기 재생'};
 function frame(t){if(!root.isConnected)return;const visible=!document.hidden&&!document.getElementById('tab-widgets').classList.contains('hidden');if(last&&playing&&visible)elapsed+=Math.min(.05,(t-last)/1000);last=t;preview.update(art,key,elapsed,false);petPreviewFrame=requestAnimationFrame(frame)}petPreviewFrame=requestAnimationFrame(frame);
}
