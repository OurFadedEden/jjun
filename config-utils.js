window.ArchiveConfig = {
 lightTheme:{deep:'#F1F5F2',blue:'#A5D4FA',gold:'#FAEDA5',paper:'#243C50',muted:'#536A78'},
 featureDefaults:{cursor:{mode:"default",file:"",size:32,hotspotX:0,hotspotY:0},"dayCounter": {"enabled": true, "startDate": "2025-09-30", "startAtOne": true, "title": "DEPTH OF OUR DAYS", "name": "함께 잠긴 시간", "unit": "m", "suffix": "일째", "futureLabel": "입수까지", "timezone": "Asia/Seoul"}, "bgm": {"enabled": true, "title": "UNDERWATER RADIO", "trackTitle": "아직 도착하지 않은 선율", "src": "", "volume": 0.35, "loop": true, "youtubeOpenLabel": "재생", "youtubeCloseLabel": "정지", "youtubeHint": "재생이 안 되면 영상의 재생 버튼을 누르거나 YouTube에서 열어 주세요.", "youtubeFallbackLabel": "YouTube에서 열기 ↗", "emptyText": "선곡을 기다리는 중", "playLabel": "재생", "pauseLabel": "일시정지", "volumeLabel": "음량", "errorText": "음악을 불러올 수 없어요. 파일 경로를 확인해 주세요."}, "messages": {"enabled": true, "title": "PRIVATE FREQUENCY", "subtitle": "두 사람 사이에 남은 교신 기록", "emptyText": "아직 수신된 기록이 없습니다.", "items": []}, "decor": {"protectImages":true,"enabled": true, "grid": true, "stamp": "PRESERVED / 0305", "verticalText": "TWILIGHT / DEEP SEA", "frame": "double"}, "hud": {"linkPrompt":"관측점을 선택해 신호를 확인하세요.","linkOpen":"연결하기","linkUnavailable":"연결 주소를 준비하고 있어요.","linkEmpty":"아직 등록된 신호가 없습니다.","resonanceTitle": "RESONANCE", "pairLabel": "PAIR LINK", "channelLabel": "RESONANCE CHANNEL", "channel": "0305", "resonanceCaption": "두 신호 사이의 공명", "pairCaption": "TWILIGHT ↔ DEEP SEA", "echoTitle": "ECHO TRACE", "echoChannel": "CH. 02", "signalOne": "JAEJUN / TWILIGHT", "signalTwo": "DOJUN / DEEP SEA", "station": "SENTINEL · GUIDE / 0305", "coordinates": "34° 03′ 05″ N", "connection": "ARCHIVE SIGNAL · CONNECTED", "endTitle": "END OF TRANSMISSION", "endNote": "NO SIGNAL IS EVER LOST.", "widgetTitle": "관측 위젯", "observationTitle": "소나 · 함께한 날짜 · 공명계 · 신호파형", "quoteLabel": "BETWEEN THE LIGHT & THE SEA", "subjectsAction": "인물 기록 ↗", "memoryAction": "기억의 조각 ↗", "emptyImage": "빛이 머물던 자리", "recordLabel": "VISUAL RECORD", "eventsTitle": "RECORDED EVENTS", "fragmentLabel": "FRAGMENT / PRESERVED LINE", "linksTitle": "OUTGOING SIGNALS", "returnLabel": "EJECT TAPE / RETURN HOME ↗"}},
  normalize(value, defaults) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('설정은 JSON 객체여야 합니다.');
    const c = structuredClone({...defaults, ...value});
    for (const key of ['theme','cover','header','dayCounter','bgm','messages','decor','hud','cursor']) c[key] = {...this.featureDefaults[key],...defaults[key], ...value[key]};
    if(c.theme.deep?.toLowerCase()==='#071521' && c.theme.paper?.toLowerCase()==='#e4edf0' && c.theme.muted?.toLowerCase()==='#8097a6') Object.assign(c.theme,{deep:this.lightTheme.deep,paper:this.lightTheme.paper,muted:this.lightTheme.muted});
    if (!Array.isArray(c.pages) || !c.pages.every(p => p && typeof p === 'object' && typeof p.id === 'string' && (!p.items || (Array.isArray(p.items) && p.items.every(x => x && typeof x === 'object'))))) throw new Error('카테고리 형식을 확인해 주세요.');
    if (!Array.isArray(c.cover.memories) || !c.cover.memories.every(s => s && typeof s === 'object')) throw new Error('회상 장면은 배열이어야 합니다.');
    c.cover.memories = c.cover.memories.map(s => ({...s, caption:s.caption || s.label || '', subcaption:s.subcaption || ''}));
    if (!Array.isArray(c.messages.items) || !c.messages.items.every(x=>x && typeof x==='object' && !Array.isArray(x))) throw new Error('교신 기록 형식을 확인해 주세요.');
    if (new Set(c.pages.map(p=>p.id)).size!==c.pages.length) throw new Error('카테고리 ID는 서로 달라야 합니다.');
    if (this.dateNumber(c.dayCounter.startDate)===null) throw new Error('시작 날짜를 확인해 주세요.');
    try{new Intl.DateTimeFormat('en',{timeZone:c.dayCounter.timezone}).format()}catch(_){throw new Error('시간대를 확인해 주세요.');}
    c.bgm.volume=Math.max(0,Math.min(1,Number(c.bgm.volume)||0));
    return c;
  },
  mediaSource(value){
    if(!value||!String(value).trim())return {type:'empty'};
    try{
      const u=new URL(String(value).trim(),location.href),host=u.hostname.toLowerCase();
      if(!['http:','https:','file:'].includes(u.protocol))return {type:'invalid'};
      const yt=['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com','youtu.be'];
      if(yt.includes(host)){
        const parts=u.pathname.split('/').filter(Boolean);
        const id=host==='youtu.be'?parts[0]:u.pathname==='/watch'?u.searchParams.get('v'):['shorts','embed','live'].includes(parts[0])?parts[1]:null;
        if(!/^[A-Za-z0-9_-]{11}$/.test(id||''))return {type:'invalid'};
        const raw=u.searchParams.get('t')||u.searchParams.get('start')||'0';
        const match=raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
        const start=/^\d+$/.test(raw)?Number(raw):match?Number(match[1]||0)*3600+Number(match[2]||0)*60+Number(match[3]||0):0;
        return {type:'youtube',id,start:Math.min(86400,start),url:'https://www.youtube.com/watch?v='+id};
      }
      return {type:'audio',url:u.href};
    }catch(_){return {type:'invalid'}}
  },
  dateNumber(value){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return null;
    const [y,m,d]=value.split('-').map(Number),date=new Date(Date.UTC(y,m-1,d));
    return date.toISOString().slice(0,10)===value?date.getTime()/86400000:null;
  },
  dayInfo(settings,now=new Date()){
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:settings.timezone||'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
    const get=t=>parts.find(x=>x.type===t).value;
    const today=this.dateNumber(`${get('year')}-${get('month')}-${get('day')}`),start=this.dateNumber(settings.startDate);
    if(start===null)return {days:0,future:false,valid:false};
    const delta=today-start;return {days:delta<0?-delta:delta+(settings.startAtOne?1:0),future:delta<0,valid:true};
  },
  async draftDB(mode, value) {
    const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('twilightArchiveDraft',1);r.onupgradeneeded=()=>r.result.createObjectStore('draft');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
    try{return await new Promise((resolve,reject)=>{const tx=db.transaction('draft',mode==='get'?'readonly':'readwrite'),store=tx.objectStore('draft');const r=mode==='get'?store.get('config'):store.put(value,'config');tx.oncomplete=()=>resolve(r.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}finally{db.close()}
  },
  async saveDraft(value) {
    const json=JSON.stringify(value);
    try{localStorage.setItem('twilightArchiveConfig',json);return}catch(_){}
    await this.draftDB('put',value);
    try{localStorage.setItem('twilightArchiveConfig',JSON.stringify({draftInDatabase:true}))}catch(_){try{localStorage.removeItem('twilightArchiveConfig')}catch(_){} }
  },
  async load(defaults, local = true) {
    let saved;
    if(local)try{saved=JSON.parse(localStorage.getItem('twilightArchiveConfig')||'null')}catch(_){}
    if(local && (!saved || saved.draftInDatabase))try{saved=await this.draftDB('get')}catch(_){}
    if(saved?.archiveEncrypted===1)return this.normalize(await ArchiveLocks.openSite(saved),defaults);
    if(saved)try{return this.normalize(saved,defaults)}catch(_){}
    let published;
    try{const r=await fetch('config.json',{cache:'no-store',signal:AbortSignal.timeout(4000)});if(r.ok)published=await r.json()}catch(_){}
    if(published?.archiveEncrypted===1)return this.normalize(await ArchiveLocks.openSite(published),defaults);
    if(published)try{return this.normalize(published,defaults)}catch(_){}
    return this.normalize(defaults,defaults);
  },
  image(src) {
    if (typeof src !== 'string' || !src.trim()) return '';
    if (/^data:image\/(png|jpeg|jpg|webp|gif|avif);base64,/i.test(src)) return src;
    try { const u = new URL(src, location.href); return ['http:','https:','file:'].includes(u.protocol) ? u.href : ''; } catch (_) { return ''; }
  },
  link(src) {
    try { const u = new URL(src || '#', location.href); return ['http:','https:','mailto:'].includes(u.protocol) ? u.href : '#'; } catch (_) { return '#'; }
  }
};
