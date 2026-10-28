/* GIF uses an image overlay; ANI frames are decoded locally, never uploaded. */
window.ArchiveCursor=(()=>{
 const svg=body=>'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">${body}</svg>`);
 const presets={sonar:svg('<circle cx="16" cy="16" r="11" fill="#FAEDA566" stroke="#456B82"/><circle cx="16" cy="16" r="5" fill="none" stroke="#456B82"/><path d="M16 16V5A11 11 0 0 1 27 16Z" fill="#A5D4FA"/><circle cx="16" cy="16" r="2" fill="#354F65"/>'),star:svg('<path d="m16 2 4 10 10 4-10 4-4 10-4-10L2 16l10-4Z" fill="#FAEDA5" stroke="#647E90"/>'),cross:svg('<circle cx="16" cy="16" r="8" fill="#A5D4FA55" stroke="#57788E"/><path d="M16 1v10m0 10v10M1 16h10m10 0h10" stroke="#355D77"/><circle cx="16" cy="16" r="2" fill="#9A8140"/>')};
 const error=()=>new Error('이 커서 형식은 읽을 수 없어요. GIF·PNG 또는 PNG/비압축 비트맵 프레임의 ANI를 사용해 주세요.');
 async function icon(bytes){
  const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);if(bytes.length<22||v.getUint16(0,true)!==0||![1,2].includes(v.getUint16(2,true)))throw error();
  const len=v.getUint32(14,true),offset=v.getUint32(18,true);if(offset+len>bytes.length||len<8)throw error();const b=bytes.slice(offset,offset+len),d=new DataView(b.buffer);let src,w,h;
  if(d.getUint32(0)===0x89504e47){const blob=new Blob([b],{type:'image/png'});const bitmap=await createImageBitmap(blob);w=bitmap.width;h=bitmap.height;if(w>256||h>256){bitmap.close();throw error()}const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(bitmap,0,0);bitmap.close();src=c.toDataURL();}
  else{
   if(b.length<40)throw error();const header=d.getUint32(0,true);w=d.getInt32(4,true);h=Math.abs(d.getInt32(8,true))/2;const bits=d.getUint16(14,true),compression=d.getUint32(16,true);if(header<40||w<1||h<1||w>256||h>256||!Number.isInteger(h)||![1,4,8,24,32].includes(bits)||compression!==0)throw error();
   const palette=bits<=8?(d.getUint32(32,true)||1<<bits):0,base=header+palette*4,stride=Math.ceil(w*bits/32)*4,maskBase=base+stride*h,maskStride=Math.ceil(w/32)*4;if(maskBase>b.length)throw error();
   const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d'),pixels=ctx.createImageData(w,h);let alpha=false;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){const row=base+(h-1-y)*stride,k=(y*w+x)*4;let pos=row+x*(bits/8);if(bits<=8){const packed=b[row+Math.floor(x*bits/8)],index=(packed>>(8-bits-(x*bits%8)))&((1<<bits)-1);pos=header+index*4;}pixels.data[k]=b[pos+2];pixels.data[k+1]=b[pos+1];pixels.data[k+2]=b[pos];pixels.data[k+3]=bits===32?b[pos+3]:255;alpha ||=bits===32&&b[pos+3]>0;}
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){const k=(y*w+x)*4;if(bits===32&&!alpha)pixels.data[k+3]=255;const m=maskBase+(h-1-y)*maskStride+Math.floor(x/8);if(m<b.length&&(b[m]&(128>>(x%8))))pixels.data[k+3]=0;}
   ctx.putImageData(pixels,0,0);src=c.toDataURL();
  }
  return {src,x:v.getUint16(2,true)===2?Math.min(w,v.getUint16(10,true))/w:.5,y:v.getUint16(2,true)===2?Math.min(h,v.getUint16(12,true))/h:.5};
 }
 async function prepare(c){
  if(c.mode!=='custom')return [{src:presets[c.mode],x:.5,y:.5,delay:100}];
  if(!c.file||c.file.length>3000000)throw error();
  if(!/^data:[^,]*;base64,/i.test(c.file))throw error();const raw=atob(c.file.split(',')[1]),b=Uint8Array.from(raw,x=>x.charCodeAt(0));
  const tag=(at)=>String.fromCharCode(...b.slice(at,at+4));
  if(tag(0)!=='RIFF'){
   if(!/^data:image\/(gif|png|webp);base64,/i.test(c.file))throw error();const img=new Image();img.src=c.file;await img.decode();if(img.naturalWidth>512||img.naturalHeight>512)throw new Error('커서 이미지는 512 × 512px 이하로 올려 주세요.');return [{src:c.file,x:Math.min(1,Math.max(0,Number(c.hotspotX)||0)),y:Math.min(1,Math.max(0,Number(c.hotspotY)||0)),delay:100}];
  }
  if(b.length<12||tag(8)!=='ACON')throw error();const view=new DataView(b.buffer),icons=[],rate=[],seq=[];let tick=6;
  function chunks(start,end,level=0){if(level>4)throw error();for(let p=start;p+8<=end;){const id=tag(p),size=view.getUint32(p+4,true),at=p+8,next=at+size;if(next>end)throw error();if(id==='LIST'){chunks(at+4,next,level+1)}else if(id==='icon'){if(icons.length>=128)throw error();icons.push(b.slice(at,next))}else if(id==='anih'&&size>=36){tick=view.getUint32(at+28,true)||6}else if(id==='rate'||id==='seq '){if(size>4096)throw error();const a=id==='rate'?rate:seq;for(let n=at;n+4<=next;n+=4)a.push(view.getUint32(n,true))}p=next+(size%2);}}
  chunks(12,Math.min(b.length,view.getUint32(4,true)+8));if(!icons.length)throw error();const frames=await Promise.all(icons.map(icon));const order=seq.length?seq:frames.map((_,i)=>i);return order.map((n,i)=>{if(!frames[n])throw error();return {...frames[n],delay:Math.max(30,Math.min(10000,(rate[i]||tick)*1000/60))}});
 }
 let cleanup=()=>{};
 async function apply(c={mode:'default'}){
  cleanup();if(c.mode==='default'||!c.mode)return;let frames;try{frames=await prepare(c)}catch(_){return}if(!frames[0]?.src)return;
  const el=document.createElement('img');el.id='archiveCursor';el.alt='';el.setAttribute('aria-hidden','true');document.body.append(el);const media=matchMedia('(hover:hover) and (pointer:fine)'),reduce=matchMedia('(prefers-reduced-motion:reduce)');let timer,step=0,active=false;
  const size=Math.min(64,Math.max(16,Number(c.size)||32));el.style.width=size+'px';el.style.height=size+'px';
  const frame=()=>{const f=frames[step];el.src=f.src;el.style.marginLeft=-(f.x*size)+'px';el.style.marginTop=-(f.y*size)+'px';if(active&&!reduce.matches&&frames.length>1)timer=setTimeout(()=>{step=(step+1)%frames.length;frame()},f.delay)};
  const hide=()=>{active=false;clearTimeout(timer);el.hidden=true;document.documentElement.classList.remove('custom-cursor')};
  const move=e=>{if(!media.matches||e.pointerType==='touch'){hide();return}if(!active){active=true;el.hidden=false;document.documentElement.classList.add('custom-cursor');frame()}el.style.left=e.clientX+'px';el.style.top=e.clientY+'px'};
  const leave=e=>{if(!e.relatedTarget)hide()};hide();
  // Freeze a GIF to its first decoded frame when reduced motion is requested.
  if(reduce.matches&&frames.length===1){const img=new Image();img.src=frames[0].src;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;canvas.getContext('2d').drawImage(img,0,0);frames[0].src=canvas.toDataURL()}
  document.addEventListener('pointermove',move);document.addEventListener('pointerout',leave);window.addEventListener('blur',hide);media.addEventListener('change',hide);const motion=()=>apply(c);reduce.addEventListener('change',motion);
  cleanup=()=>{hide();el.remove();document.removeEventListener('pointermove',move);document.removeEventListener('pointerout',leave);window.removeEventListener('blur',hide);media.removeEventListener('change',hide);reduce.removeEventListener('change',motion)};
 }
 return {prepare,apply,presets};
})();
