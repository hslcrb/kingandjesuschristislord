import { chromium } from '@playwright/test';
const browser=await chromium.launch({channel:'msedge',headless:true,timeout:120000});
const page=await browser.newPage();
page.on('response',r=>{if(r.url().includes('.mp3'))console.log('RESPONSE',r.status(),JSON.stringify(r.headers()));});
page.on('requestfailed',r=>console.log('FAILED',r.url(),r.failure()));
for(const url of ['http://127.0.0.1:5197/audio/narration.mp3','http://127.0.0.1:4197/audio/narration.mp3']){
  await page.setContent(`<audio id="a" preload="auto" controls src="${url}"></audio><button id="b" onclick="document.querySelector('audio').play().catch(e=>document.body.dataset.error=e.message)">play</button>`);
  await page.locator('#b').click();await page.waitForTimeout(8000);
  console.log(url,await page.locator('audio').evaluate(a=>({time:a.currentTime,ready:a.readyState,paused:a.paused,duration:a.duration,error:a.error?.message,buffered:a.buffered.length,network:a.networkState,playError:document.body.dataset.error})));
}
await browser.close();
