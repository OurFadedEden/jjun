/* Pixel sprite presentation: generated source art, fixed 30×30 logical display. */
window.PetPixels=(()=>{
 const actions={idle:[0,0,0,0,0,1,0,0],sit:[2,2,2,3],walk:[4,5],jump:[6,7,7],frown:[8,9],dance:[10,11],together:[12,13],drag:[14,15]};
 const sheets={jaejun:{src:'assets/pets/jaejun-pixel-sheet.png',xs:[0,318,634,950,1254],ys:[0,333,635,931,1254]},dojun:{src:'assets/pets/dojun-pixel-sheet.png',xs:[0,314,626,940,1254],ys:[0,356,670,963,1254]}};
 const cache=new Map();
 function load(id){if(cache.has(id))return cache.get(id);const record={frames:null,error:false},sheet=sheets[id];cache.set(id,record);const image=new Image();image.onload=()=>{try{
  record.frames=Array.from({length:16},(_,i)=>{
   const x=i%4,y=Math.floor(i/4),sx=sheet.xs[x],sy=sheet.ys[y],sw=sheet.xs[x+1]-sx,sh=sheet.ys[y+1]-sy;
   const canvas=document.createElement('canvas');canvas.width=canvas.height=30;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
   // All poses in a sheet use the same scale; sitting never enlarges the head.
   const scale=28/356,w=Math.round(sw*scale),h=Math.round(sh*scale);
   ctx.drawImage(image,sx,sy,sw,sh,Math.floor((30-w)/2),29-h,w,h);
   const pixels=ctx.getImageData(0,0,30,30);for(let n=0;n<pixels.data.length;n+=4){pixels.data[n+3]=pixels.data[n+3]<48?0:255}ctx.putImageData(pixels,0,0);
   return canvas;
  });
 }catch(_){record.error=true}};image.onerror=()=>{record.error=true};image.src=sheet.src;return record;}
 function paint(canvas,id,state,time,still){const record=load(id);if(record.error)return 'error';if(!record.frames)return 'loading';const sequence=actions[state]||actions.idle,frame=sequence[still?0:Math.floor(time*(state==='walk'?7:state==='dance'?5:3))%sequence.length];if(canvas.dataset.frame!==`${id}:${frame}`){const ctx=canvas.getContext('2d');ctx.clearRect(0,0,30,30);ctx.drawImage(record.frames[frame],0,0);canvas.dataset.frame=`${id}:${frame}`}return 'ready'}
 return {paint};
})();
