const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 const base='http://127.0.0.1:8000/';
 await page.addInitScript(()=>{window.seenFrames=[];setInterval(()=>{const signal=document.querySelector('#coverSignal')?.textContent;const label=document.querySelector('#reelLabel')?.textContent;if(signal?.includes('MEMORY REEL')&&window.seenFrames.at(-1)!==label)window.seenFrames.push(label)},40)});
 await page.goto(base);await page.waitForSelector('#coverScreen.playing');
 assert.equal(await page.locator('#entrance button').count(),0);
 await page.screenshot({path:path.join(root,'artifacts/entrance-desktop.png')});
 await page.waitForSelector('#archive:not(.hidden)',{timeout:22000});
 assert.deepEqual(await page.evaluate(()=>window.seenFrames),JSON.parse(fs.readFileSync(path.join(root,'config.json'),'utf8')).cover.memories.map(s=>s.caption));
 await page.screenshot({path:path.join(root,'artifacts/archive-desktop.png'),animations:'disabled'});
 for(const id of ['subjects','relationship','memory','video','links','home']){await page.locator(`[data-page="${id}"]`).click();assert.ok(await page.locator('#pageContent').textContent());}
 await page.locator('#backButton').click();await page.waitForSelector('#coverScreen.playing');assert.match(await page.locator('#coverSignal').textContent(),/01 \/ 05/);
 console.log('PASS: 5 scenes autoplay in order, automatic entry, 6 categories, replay');
 await page.goto(base+'admin.html');await page.waitForSelector('#memorySceneFields .item-editor');assert.equal(await page.locator('#memorySceneFields .item-editor').count(),5);
 await page.locator('[data-path="cover.memories.4.caption"]').fill('FIFTH EDITED');
 await page.locator('[aria-label="장면 5 위로"]').click();assert.equal(await page.locator('[data-path="cover.memories.3.caption"]').inputValue(),'FIFTH EDITED');
 await page.locator('#addScene').click();assert.equal(await page.locator('#memorySceneFields .item-editor').count(),6);
 await page.locator('[aria-label="장면 6 삭제"]').click();assert.equal(await page.locator('#memorySceneFields .item-editor').count(),5);
 await page.locator('[data-path="cover.title"]').fill('황혼기록 · 보존된 기억');
 await page.locator('[data-path="cover.durationMs"]').fill('1000');
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
 await page.locator('[data-image="cover.memories.0.image"]').setInputFiles({name:'memory.png',mimeType:'image/png',buffer:png});
 await page.waitForSelector('[data-preview="cover.memories.0.image"] img');
 await page.locator('#saveLocal').click();
 const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadPromise;const exported=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(exported.cover.memories[3].caption,'FIFTH EDITED');assert.equal(exported.pages.length,6);assert.ok(exported.cover.memories[0].image.startsWith('data:image/png'));
 const popupPromise=context.waitForEvent('page');await page.locator('#preview').click();const preview=await popupPromise;await preview.waitForSelector('#coverScreen.playing');assert.equal(await preview.locator('#coverTitle').textContent(),'황혼기록 · 보존된 기억');await preview.waitForFunction(()=>document.querySelector('#memoryReel img')?.naturalWidth>0);await preview.waitForSelector('#archive:not(.hidden)',{timeout:10000});await preview.close();
 console.log('PASS: scene edit/reorder/add/delete, photo upload, export and saved preview');
 await context.clearCookies();await page.evaluate(()=>localStorage.clear());
 for(const width of [390,320]){
  await page.setViewportSize({width,height:844});await page.goto(base);await page.waitForSelector('#coverScreen.playing');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(width===390)await page.screenshot({path:path.join(root,'artifacts/entrance-mobile.png')});
  await page.waitForSelector('#archive:not(.hidden)',{timeout:22000});
  for(const id of ['home','subjects','relationship','memory','video','links']){await page.locator(`[data-page="${id}"]`).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width} ${id} overflow`);}
  await page.locator('[data-page="subjects"]').click();if(width===390)await page.screenshot({path:path.join(root,'artifacts/subjects-mobile.png'),fullPage:true});
  await page.goto(base+'admin.html');await page.waitForSelector('#memorySceneFields .item-editor');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 console.log('PASS: 320px and 390px entrance, all categories and admin without overflow');
 await page.setViewportSize({width:1280,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 const config=JSON.parse(fs.readFileSync(path.join(root,'config.json'),'utf8'));config.cover.memories=[{image:'/missing-photo.png',label:'LEGACY LABEL',subcaption:'legacy'}];config.cover.durationMs=1000;
 await page.route('**/config.json',route=>route.fulfill({json:config}));await page.goto(base);await page.waitForSelector('#coverScreen.playing');assert.equal(await page.locator('#reelLabel').textContent(),'LEGACY LABEL');await page.waitForSelector('#archive:not(.hidden)');
 config.cover.memories=[];await page.goto(base);await page.waitForSelector('#archive:not(.hidden)');
 console.log('PASS: legacy label, missing photo, empty reel and reduced motion');
 await page.unroute('**/config.json');await page.route('**/config.json',route=>route.fulfill({status:404,body:'missing'}));await page.goto(base);await page.waitForSelector('#coverScreen.playing');assert.match(await page.locator('#coverSignal').textContent(),/01 \/ 05/);
 assert.deepEqual(errors,[]);console.log('PASS: missing config fallback; no uncaught browser errors');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
