/* Local-only canvas export; uploaded photos never leave the browser. */
(()=>{
 const get=id=>document.getElementById('share'+id),canvas=get('Canvas'),ctx=canvas.getContext('2d');let photo=null,loadId=0;
 const line=(x,y,x2,y2,color,width=1)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke()};
 function text(value,x,y,max,size,color,font='serif'){ctx.fillStyle=color;let actual=size;do{ctx.font=`${actual}px ${font}`;if(ctx.measureText(value).width<=max)break;actual--}while(actual>12);if(ctx.measureText(value).width>max){while(value.length&&ctx.measureText(value+'…').width>max)value=value.slice(0,-1);value+='…'}ctx.fillText(value,x,y)}
 function draw(){const dark=get('Mood').value==='dark',ink=dark?'#dceaf4':'#294d63',muted=dark?'#99b7c9':'#58798d',gold=dark?'#faeda5':'#907539';ctx.clearRect(0,0,1200,630);const bg=ctx.createLinearGradient(0,0,1200,630);bg.addColorStop(0,dark?'#102533':'#fff8d8');bg.addColorStop(1,dark?'#15374b':'#dceefa');ctx.fillStyle=bg;ctx.fillRect(0,0,1200,630);
 ctx.save();ctx.globalAlpha=.13;for(let x=38;x<1200;x+=40)line(x,25,x,605,muted);for(let y=25;y<630;y+=40)line(25,y,1175,y,muted);ctx.restore();
 // Right image window preserves the entire left title column at every crop position.
 const box={x:610,y:91,w:538,h:438};ctx.save();ctx.beginPath();ctx.rect(box.x,box.y,box.w,box.h);ctx.clip();
 if(photo){const scale=Math.max(box.w/photo.naturalWidth,box.h/photo.naturalHeight)*Number(get('Zoom').value),w=photo.naturalWidth*scale,h=photo.naturalHeight*scale;ctx.drawImage(photo,box.x+(box.w-w)*Number(get('X').value),box.y+(box.h-h)*Number(get('Y').value),w,h)}else{ctx.fillStyle=dark?'#18394b':'#d4e8ec';ctx.fillRect(box.x,box.y,box.w,box.h);text('AWAITING A MEMORY',722,322,370,18,muted,'monospace')}
 const shade=ctx.createLinearGradient(0,440,0,529);shade.addColorStop(0,'#102b3b00');shade.addColorStop(1,'#102b3b80');ctx.fillStyle=shade;ctx.fillRect(box.x,440,box.w,89);ctx.restore();
 ctx.strokeStyle=dark?'#a5d4fa55':'#ffffff';ctx.lineWidth=2;ctx.strokeRect(602,83,554,454);
 // Sparse sonar arcs and corner fiducials, rather than a busy frame over the photo.
 ctx.save();ctx.strokeStyle=dark?'#a5d4fa30':'#6c9db544';ctx.lineWidth=1;for(const r of [35,65,95]){ctx.beginPath();ctx.arc(490,450,r,0,Math.PI*2);ctx.stroke()}line(385,450,595,450,ctx.strokeStyle);line(490,345,490,555,ctx.strokeStyle);ctx.fillStyle=gold;ctx.beginPath();ctx.arc(521,418,3,0,7);ctx.fill();ctx.restore();
 ctx.strokeStyle=dark?'#8eb5cc66':'#7597a066';ctx.lineWidth=1;ctx.strokeRect(20.5,20.5,1159,589);ctx.strokeRect(27.5,27.5,1145,575);
 for(const [x,y,sx,sy] of [[38,38,1,1],[1162,38,-1,1],[38,592,1,-1],[1162,592,-1,-1]]){line(x,y,x+24*sx,y,gold,2);line(x,y,x,y+24*sy,gold,2)}
 text('DEEP SEA OBSERVATION / PRIVATE ARCHIVE',64,65,740,13,muted,'monospace');text(get('Tape').value,947,65,200,13,muted,'monospace');
 line(65,167,110,167,gold,3);line(116,167,161,167,'#8bbcdc',3);
 text(get('Title').value,62,272,510,66,ink);text(get('Subtitle').value,65,315,500,19,muted,'Georgia, serif');
 line(65,352,438,352,dark?'#a5d4fa44':'#83a6b666');text(get('Caption').value,65,389,480,20,ink);
 text('SIGNAL 01  /  TWILIGHT',65,462,350,12,gold,'monospace');text('SIGNAL 02  /  DEEP SEA',65,488,350,12,muted,'monospace');
 text('PRESERVED MEMORY  ·  0305',630,507,480,12,'#fff8df','monospace');
 text('NO SIGNAL IS EVER LOST.',65,574,700,12,muted,'monospace');for(let i=0;i<44;i++)line(1000+i*3,557,1000+i*3,576,muted,i%3===0?2:1);
 }
 get('Photo').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;const id=++loadId;get('Status').textContent='사진을 읽는 중…';try{if(file.size>30*1024*1024)throw Error('30MB 이하 사진을 선택해 주세요.');const src=URL.createObjectURL(file);let img;try{img=new Image();img.src=src;await img.decode()}finally{URL.revokeObjectURL(src)}if(id!==loadId)return;photo=img;for(const key of ['X','Y'])get(key).value='.5';get('Zoom').value='1';draw();get('Status').textContent='사진의 확대·가로·세로 위치를 조절해 주세요. GIF는 정지 이미지로 내보냅니다.'}catch(error){if(id===loadId)get('Status').textContent=error.message||'사진을 읽지 못했어요.'}finally{e.target.value=''}});
 for(const key of ['Mood','Title','Subtitle','Caption','Tape','Zoom','X','Y'])get(key).addEventListener('input',draw);
 get('Remove').onclick=()=>{loadId++;photo=null;draw();get('Status').textContent='사진을 제거했어요.'};
 get('Download').onclick=()=>{draw();canvas.toBlob(blob=>{if(!blob){get('Status').textContent='이미지를 만들지 못했어요. 다시 시도해 주세요.';return}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='share-card.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);get('Status').textContent='1200 × 630 PNG를 만들었어요. 나루의 assets/share-card.png에 교체해 주세요.'},'image/png')};
 draw();document.fonts.ready.then(draw);
})();
