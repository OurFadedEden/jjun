/* Local-only canvas export; uploaded photos never leave the browser. */
(()=>{
 const get=id=>document.getElementById('share'+id),canvas=get('Canvas'),ctx=canvas.getContext('2d');let photo=null,loadId=0;
 const line=(x,y,x2,y2,color,width=1)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke()};
 function text(value,x,y,max,size,color,font='serif'){ctx.fillStyle=color;let actual=size;do{ctx.font=`${actual}px ${font}`;if(ctx.measureText(value).width<=max)break;actual--}while(actual>12);if(ctx.measureText(value).width>max){while(value.length&&ctx.measureText(value+'…').width>max)value=value.slice(0,-1);value+='…'}ctx.fillText(value,x,y)}
 function draw(){
 const dark=get('Mood').value==='dark',ink=dark?'#f2f6ee':'#233f52',accent=dark?'#faeda5':'#786338';
 ctx.clearRect(0,0,1200,630);const bg=ctx.createLinearGradient(0,0,1200,630);bg.addColorStop(0,dark?'#102533':'#fff8d8');bg.addColorStop(1,dark?'#15374b':'#dceefa');ctx.fillStyle=bg;ctx.fillRect(0,0,1200,630);
 if(photo){const scale=Math.max(1200/photo.naturalWidth,630/photo.naturalHeight)*Number(get('Zoom').value),w=photo.naturalWidth*scale,h=photo.naturalHeight*scale;ctx.drawImage(photo,(1200-w)*Number(get('X').value),(630-h)*Number(get('Y').value),w,h)}
 const quote=get('Caption').value.trim(),position=get('QuotePosition').value,cy=position==='top'?155:position==='center'?315:485;
 if(quote){const wash=ctx.createLinearGradient(0,Math.max(0,cy-175),0,Math.min(630,cy+175)),color=dark?'12,31,46':'250,247,225',opacity=Number(get('Shade').value);wash.addColorStop(0,`rgba(${color},0)`);wash.addColorStop(.5,`rgba(${color},${opacity})`);wash.addColorStop(1,`rgba(${color},0)`);ctx.fillStyle=wash;ctx.fillRect(0,0,1200,630)}
 // The photograph runs edge to edge. Only fine observation marks sit above it.
 ctx.save();ctx.shadowColor=dark?'#06131d':'#fffdf0';ctx.shadowBlur=4;ctx.strokeStyle=dark?'#b9e0f0':'#35586c';ctx.lineWidth=1;for(const r of [30,55,80]){ctx.beginPath();ctx.arc(1070,140,r,0,Math.PI*2);ctx.stroke()}line(978,140,1162,140,ctx.strokeStyle);line(1070,48,1070,232,ctx.strokeStyle);ctx.fillStyle=accent;ctx.beginPath();ctx.arc(1095,109,2.5,0,7);ctx.fill();ctx.restore();
 // Opposite under-strokes preserve the border over both bright and dark pixels.
 ctx.save();ctx.strokeStyle=dark?'#071b2dcc':'#fffce6dd';ctx.lineWidth=4;ctx.strokeRect(20.5,20.5,1159,589);ctx.strokeRect(27.5,27.5,1145,575);
 ctx.strokeStyle=dark?'#d8eaf1':'#35596b';ctx.lineWidth=1.2;ctx.strokeRect(20.5,20.5,1159,589);ctx.strokeRect(27.5,27.5,1145,575);
 ctx.shadowColor=dark?'#06131d':'#fffdf0';ctx.shadowBlur=5;
 for(const [x,y,sx,sy] of [[38,38,1,1],[1162,38,-1,1],[38,592,1,-1],[1162,592,-1,-1]]){line(x,y,x+24*sx,y,dark?'#071b2d':'#fffce6',5);line(x,y,x,y+24*sy,dark?'#071b2d':'#fffce6',5);line(x,y,x+24*sx,y,accent,2);line(x,y,x,y+24*sy,accent,2)}
 for(let i=0;i<32;i++){const x=66+i*4;line(x,565,x,565+(i%4===0?12:5),dark?'#a5d4fa88':'#466b8088')}
 line(1088,570,1113,570,accent,2);line(1120,570,1145,570,'#a5d4fa',2);
 ctx.restore();
 if(quote){ctx.save();ctx.font='36px Georgia, serif';const lines=[];for(const paragraph of quote.split('\n')){let current='';for(const char of paragraph){if(ctx.measureText(current+char).width>950&&current){lines.push(current);current=char}else current+=char}lines.push(current)}const shown=lines.slice(0,5);if(lines.length>5)shown[4]+='…';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=ink;ctx.shadowColor=dark?'#102332aa':'#fff9eccc';ctx.shadowBlur=5;shown.forEach((value,i)=>ctx.fillText(value,600,cy+(i-(shown.length-1)/2)*50));ctx.restore()}
 }
 get('Photo').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;const id=++loadId;get('Status').textContent='사진을 읽는 중…';try{if(file.size>30*1024*1024)throw Error('30MB 이하 사진을 선택해 주세요.');const src=URL.createObjectURL(file);let img;try{img=new Image();img.src=src;await img.decode()}finally{URL.revokeObjectURL(src)}if(id!==loadId)return;photo=img;for(const key of ['X','Y'])get(key).value='.5';get('Zoom').value='1';draw();get('Status').textContent='사진의 확대·가로·세로 위치를 조절해 주세요. GIF는 정지 이미지로 내보냅니다.'}catch(error){if(id===loadId)get('Status').textContent=error.message||'사진을 읽지 못했어요.'}finally{e.target.value=''}});
 for(const key of ['Mood','Caption','QuotePosition','Shade','Zoom','X','Y'])get(key).addEventListener('input',draw);
 get('Remove').onclick=()=>{loadId++;photo=null;draw();get('Status').textContent='사진을 제거했어요.'};
 get('Download').onclick=()=>{draw();canvas.toBlob(blob=>{if(!blob){get('Status').textContent='이미지를 만들지 못했어요. 다시 시도해 주세요.';return}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='share-card.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);get('Status').textContent='1200 × 630 PNG를 만들었어요. 나루의 assets/share-card.png에 교체해 주세요.'},'image/png')};
 draw();document.fonts.ready.then(draw);
})();
