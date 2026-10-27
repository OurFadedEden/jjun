window.ArchiveConfig = {
 featureDefaults:{"dayCounter": {"enabled": true, "startDate": "2025-09-30", "startAtOne": true, "title": "DEPTH OF OUR DAYS", "name": "함께 잠긴 시간", "unit": "m", "suffix": "일째", "futureLabel": "입수까지", "timezone": "Asia/Seoul"}, "bgm": {"enabled": true, "title": "UNDERWATER RADIO", "trackTitle": "아직 도착하지 않은 선율", "src": "", "volume": 0.35, "loop": true, "emptyText": "선곡을 기다리는 중", "playLabel": "재생", "pauseLabel": "일시정지", "volumeLabel": "음량", "errorText": "음악을 불러올 수 없어요. 파일 경로를 확인해 주세요."}, "messages": {"enabled": true, "title": "PRIVATE FREQUENCY", "subtitle": "두 사람 사이에 남은 교신 기록", "emptyText": "아직 수신된 기록이 없습니다.", "items": []}, "decor": {"enabled": true, "grid": true, "stamp": "PRESERVED / 0305", "verticalText": "TWILIGHT / DEEP SEA", "frame": "double"}, "hud": {"resonanceTitle": "RESONANCE", "pairLabel": "PAIR LINK", "channelLabel": "RESONANCE CHANNEL", "channel": "0305", "resonanceCaption": "두 신호 사이의 공명", "pairCaption": "TWILIGHT ↔ DEEP SEA", "echoTitle": "ECHO TRACE", "echoChannel": "CH. 02", "signalOne": "JAEJUN / TWILIGHT", "signalTwo": "DOJUN / DEEP SEA", "station": "SENTINEL · GUIDE / 0305", "coordinates": "34° 03′ 05″ N", "connection": "ARCHIVE SIGNAL · CONNECTED", "endTitle": "END OF TRANSMISSION", "endNote": "NO SIGNAL IS EVER LOST.", "widgetTitle": "관측 위젯", "quoteLabel": "BETWEEN THE LIGHT & THE SEA", "subjectsAction": "인물 기록 ↗", "memoryAction": "기억의 조각 ↗", "emptyImage": "빛이 머물던 자리", "recordLabel": "VISUAL RECORD", "eventsTitle": "RECORDED EVENTS", "fragmentLabel": "FRAGMENT / PRESERVED LINE", "linksTitle": "OUTGOING SIGNALS", "returnLabel": "EJECT TAPE / RETURN HOME ↗"}},
  normalize(value, defaults) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('설정은 JSON 객체여야 합니다.');
    const c = structuredClone({...defaults, ...value});
    for (const key of ['theme','cover','header','dayCounter','bgm','messages','decor','hud']) c[key] = {...this.featureDefaults[key],...defaults[key], ...value[key]};
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
  async load(defaults, local = true) {
    if (local) try {
      const saved = localStorage.getItem('twilightArchiveConfig');
      if (saved) return this.normalize(JSON.parse(saved), defaults);
    } catch (_) { /* Keep an unreadable draft untouched and use published data. */ }
    try {
      const r = await fetch('config.json', {cache:'no-store', signal:AbortSignal.timeout(4000)});
      if (r.ok) return this.normalize(await r.json(), defaults);
    } catch (_) {}
    return this.normalize(defaults, defaults);
  },
  image(src) {
    if (typeof src !== 'string') return '';
    if (/^data:image\/(png|jpeg|jpg|webp|gif|avif);base64,/i.test(src)) return src;
    try { const u = new URL(src, location.href); return ['http:','https:','file:'].includes(u.protocol) ? u.href : ''; } catch (_) { return ''; }
  },
  link(src) {
    try { const u = new URL(src || '#', location.href); return ['http:','https:','mailto:'].includes(u.protocol) ? u.href : '#'; } catch (_) { return '#'; }
  }
};
