const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const context=await browser.newContext({permissions:['clipboard-read','clipboard-write']}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8000/?preview=1');await page.locator('#skipReel').click();
 const text='서술 속 \'작은따옴표\'와 ‘생각’은 그대로.\n“큰따옴표 대사.”\n설명 속 "짧은 대사"와 <img src=x onerror=alert(1)>\n「기억해 줘.」';
 await page.evaluate(text=>{const p=config.pages.find(p=>p.type==='memory');p.items=[{title:'테스트',description:text}];showPage(p.id)},text);
 assert.equal(await page.locator('.category-link-copy').count(),0);
 assert.ok(await page.locator('#pageContent .quote').isVisible());
 const entry=page.locator('.memory-entry').first();await entry.locator('summary').click();
 assert.equal(await entry.locator('.log-dialogue').count(),3);assert.equal(await entry.locator('.log-dialogue-line').count(),2);assert.equal(await entry.locator('img').count(),0);
 assert.equal(await page.locator('[data-copy-log],.memory-log-tools').count(),0);
 await page.evaluate(()=>showPage('prompts'));
 await page.locator('.category-link-copy').click();const url=await page.evaluate(()=>navigator.clipboard.readText());assert.ok(url.endsWith('#page=prompts'));assert.ok(!url.includes('preview'));
 assert.equal(await page.locator('.category-link-copy svg').evaluate(e=>e.getBoundingClientRect().width),12);
 await page.evaluate(()=>{const p=config.pages.find(p=>p.id==='prompts');p.type='prompts';delete p._sealed;p.items=[];showPage(p.id)});
 assert.equal(await page.locator('.category-link-copy').count(),1);
 for(const id of ['home','subjects','relationship','memory','video','links']){await page.evaluate(id=>showPage(id),id);assert.equal(await page.locator('.category-link-copy').count(),0)}
 await page.evaluate(()=>showPage('memory'));await page.locator('.memory-entry summary').click();

 for(const width of [1440,390,320]){await page.setViewportSize({width,height:900});for(const mode of ['light','dark']){await page.evaluate(mode=>document.documentElement.dataset.mode=mode,mode);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}}
 await page.goto(url);await page.locator('#skipReel').click();assert.equal(await page.locator('#pageContent').getAttribute('data-page-id'),'prompts');assert.equal(await page.locator('.category-link-copy').count(),1);
 assert.deepEqual(errors,[]);console.log('PASS: single quotes unstyled; double quotes styled safely; no log copy controls; prompt-only compact link; locked deep link; responsive modes');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
