window.ArchiveConfig = {
  normalize(value, defaults) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('설정은 JSON 객체여야 합니다.');
    const c = structuredClone({...defaults, ...value});
    for (const key of ['theme','cover','header']) c[key] = {...defaults[key], ...value[key]};
    if (!Array.isArray(c.pages) || !c.pages.every(p => p && typeof p === 'object' && typeof p.id === 'string' && (!p.items || (Array.isArray(p.items) && p.items.every(x => x && typeof x === 'object'))))) throw new Error('카테고리 형식을 확인해 주세요.');
    if (!Array.isArray(c.cover.memories) || !c.cover.memories.every(s => s && typeof s === 'object')) throw new Error('회상 장면은 배열이어야 합니다.');
    c.cover.memories = c.cover.memories.map(s => ({...s, caption:s.caption || s.label || '', subcaption:s.subcaption || ''}));
    return c;
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
