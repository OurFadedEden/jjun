const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1360,height:950}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install({time:new Date('2026-01-01T00:00:00Z')});await page.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));await page.goto('http://127.0.0.1:8000/');await page.waitForSelector('#coverScreen.playing');

 assert.equal(await page.locator('.tape-controls button').allTextContents().then(x=>x.join('').trim()),'');
 await page.screenshot({path:'artifacts/transport-desktop.png'});
 await page.locator('#fastForward').click();assert.equal(await page.locator('#fastForward').getAttribute('aria-pressed'),'true');
 await page.clock.runFor(900);assert.match(await page.locator('#coverSignal').textContent(),/02 \/ 05/);
 await page.locator('#fastForward').press('Enter');assert.equal(await page.locator('#fastForward').getAttribute('aria-pressed'),'false');
 await page.clock.runFor(1000);assert.match(await page.locator('#coverSignal').textContent(),/02 \/ 05/);
 await page.locator('#skipReel').click();assert.equal(await page.locator('#archive').isVisible(),true);
 await page.clock.runFor(20000);assert.equal(await page.locator('#archive').isVisible(),true);
 await page.locator('#backButton').click();assert.equal(await page.locator('#fastForward').getAttribute('aria-pressed'),'false');assert.match(await page.locator('#coverSignal').textContent(),/01 \/ 05/);
 await page.locator('#fastForward').press('Space');await page.clock.runFor(4100);assert.equal(await page.locator('#archive').isVisible(),true);
 for(const width of [390,320]){
  await page.setViewportSize({width,height:844});await page.locator('#backButton').click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const screen=await page.locator('#coverScreen').boundingBox(),controls=await page.locator('.tape-controls').boundingBox();assert.ok(controls.x>=screen.x+screen.width);
  if(width===390)await page.screenshot({path:'artifacts/transport-mobile.png'});
  await page.locator('#skipReel').click();
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#backButton').click();
 assert.equal(await page.locator('.reel-placeholder').first().evaluate(el=>getComputedStyle(el).animationName),'none');
 await page.locator('#fastForward').click();await page.clock.runFor(4100);assert.equal(await page.locator('#archive').isVisible(),true);
 assert.deepEqual(errors,[]);console.log('PASS: 4x timing, toggle, keyboard, skip timer cleanup, replay reset, fast auto-entry, mobile right controls, reduced motion');
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
