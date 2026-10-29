/* Analyze only local/readable image pixels. Cross-origin images retain a safe fallback. */
window.ReelContrast=(()=>{
 const targets=()=>[...document.querySelectorAll('#coverScreen .screen-label,#coverScreen .screen-time,#coverScreen .screen-bottom,#coverScreen .reel-label,#coverScreen .reel-subcaption')];
 let current=null;
 function reset(){current=null;for(const el of targets()){delete el.dataset.photoInk;for(const key of ['color','text-shadow','background','box-shadow','border-radius'])el.style.removeProperty(key)}}
 function paint(el,dark){el.dataset.photoInk=dark?'dark':'light';el.style.setProperty('color',dark?'#172f40':'#fff9e8','important');el.style.setProperty('text-shadow',dark?'0 1px 3px #ffffffb3,0 0 8px #fff9':'0 1px 3px #061521,0 0 8px #061521','important');el.style.setProperty('background',dark?'#fff8e52b':'#07182740','important');el.style.setProperty('box-shadow',dark?'0 0 10px 5px #fff8e52b':'0 0 10px 5px #07182740','important');el.style.setProperty('border-radius','3px')}
 function update(img){if(!img?.isConnected||!img.naturalWidth)return;current=img;const screen=document.getElementById('memoryReel'),bounds=screen.getBoundingClientRect();if(!bounds.width||!bounds.height)return;
 const c=document.createElement('canvas');c.width=160;c.height=Math.max(1,Math.round(160*bounds.height/bounds.width));const ctx=c.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#050c12';ctx.fillRect(0,0,c.width,c.height);const scale=Math.min(c.width/img.naturalWidth,c.height/img.naturalHeight),w=img.naturalWidth*scale,h=img.naturalHeight*scale;
 let pixels;try{ctx.drawImage(img,(c.width-w)/2,(c.height-h)/2,w,h);pixels=ctx.getImageData(0,0,c.width,c.height).data}catch(_){for(const el of targets())paint(el,false);return}
 for(const el of targets()){const r=el.getBoundingClientRect(),x0=Math.max(0,Math.floor((r.left-bounds.left)/bounds.width*c.width)),x1=Math.min(c.width,Math.ceil((r.right-bounds.left)/bounds.width*c.width)),y0=Math.max(0,Math.floor((r.top-bounds.top)/bounds.height*c.height)),y1=Math.min(c.height,Math.ceil((r.bottom-bounds.top)/bounds.height*c.height));let total=0,n=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*c.width+x)*4;total+=(pixels[i]*.2126+pixels[i+1]*.7152+pixels[i+2]*.0722)/255;n++}paint(el,n>0&&total/n>.57)}
 }
 let timer;window.addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(()=>update(current),120)});
 return {reset,update};
})();
