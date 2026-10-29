const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{const context=await b.newContext(),p=await context.newPage();const base='http://127.0.0.1:8000/';await p.goto(base+'admin.html');await p.waitForFunction(()=>!document.querySelector('#saveLocal').disabled);const published=await p.evaluate(async()=> (await (await fetch('config.json')).json()).header.brand);
await p.evaluate(async()=>{cfg.header.brand='UNPUBLISHED DRAFT';await ArchiveConfig.saveDraft(cfg)});
await p.goto(base);await p.waitForFunction(()=>typeof config!=='undefined'&&config.header);assert.equal(await p.evaluate(()=>config.header.brand),published);
await p.goto(base+'?preview=1');await p.waitForFunction(()=>typeof config!=='undefined'&&config.header);assert.equal(await p.evaluate(()=>config.header.brand),'UNPUBLISHED DRAFT');
await p.goto(base+'admin.html');await p.waitForFunction(()=>!document.querySelector('#saveLocal').disabled);assert.equal(await p.evaluate(()=>cfg.header.brand),'UNPUBLISHED DRAFT');
await p.evaluate(async()=>{cfg.header.brand='LARGE PRIVATE DRAFT';cfg.padding='x'.repeat(7*1024*1024);await ArchiveConfig.saveDraft(cfg)});
await p.goto(base);await p.waitForFunction(()=>typeof config!=='undefined'&&config.header);assert.equal(await p.evaluate(()=>config.header.brand),published);
await p.goto(base+'?preview=1');await p.waitForFunction(()=>typeof config!=='undefined'&&config.header);assert.equal(await p.evaluate(()=>config.header.brand),'LARGE PRIVATE DRAFT');console.log('PASS: ordinary visits use published config, previews use local/IndexedDB drafts, admin retains edits');}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
