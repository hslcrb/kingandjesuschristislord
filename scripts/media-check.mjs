import { chromium } from '@playwright/test';
const browser=await chromium.launch({channel:'msedge',headless:true,timeout:120000});
const page=await browser.newPage({viewport:{width:1200,height:900}});
page.setDefaultTimeout(60000);
page.on('console',m=>{if(m.text().startsWith('MEDIA'))console.log(m.text());});
await page.goto('http://127.0.0.1:5197',{waitUntil:'domcontentloaded',timeout:120000});
await page.locator('#start').waitFor();
await page.evaluate(()=>{
  for(const a of document.querySelectorAll('audio'))for(const name of ['play','playing','pause','waiting','seeking','seeked','stalled','suspend','error'])a.addEventListener(name,()=>console.log('MEDIA',a.id,name,a.currentTime,a.readyState));
  document.addEventListener('visibilitychange',()=>console.log('MEDIA visibility',document.visibilityState));
});
await page.locator('#start').click();
await page.waitForTimeout(4000);
console.log(JSON.stringify(await page.evaluate(()=>({visibility:document.visibilityState,playing:document.body.classList.contains('playing'),toast:document.querySelector('#toast').textContent,audio:[...document.querySelectorAll('audio')].map(a=>({id:a.id,paused:a.paused,time:a.currentTime,ready:a.readyState,error:a.error?.message,seeking:a.seeking,buffered:a.buffered.length?Array.from({length:a.buffered.length},(_,i)=>[a.buffered.start(i),a.buffered.end(i)]):[]}))})),null,2));
await browser.close();
