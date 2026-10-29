window.ArchiveAtmosphere={
 init(){
 const button=document.getElementById('modeSwitch');let dark=false;
 try{dark=localStorage.getItem('twilightDisplayMode')==='dark'}catch(_){}
 const setMode=value=>{document.documentElement.dataset.mode=value?'dark':'light';button.setAttribute('aria-checked',String(value))};
 setMode(dark);button.onclick=()=>{dark=!dark;setMode(dark);try{localStorage.setItem('twilightDisplayMode',dark?'dark':'light')}catch(_){}};
 const settings=config.transmission,lines=String(settings?.lines||'').split('\n').map(s=>s.trim()).filter(Boolean);
 const strip=document.getElementById('randomTransmission');strip.hidden=!settings?.enabled||!lines.length;
 if(!strip.hidden)strip.querySelector('p').textContent=lines[Math.floor(Math.random()*lines.length)];
 }
};
