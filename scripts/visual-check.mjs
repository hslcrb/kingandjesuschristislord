import { chromium } from '@playwright/test';
import { scenes, sceneStarts } from '../src/story.js';
const browser=await chromium.launch({channel:'msedge',headless:true,timeout:120000});
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
page.setDefaultTimeout(90000);page.on('pageerror',e=>console.log('ERROR',e.message));
await page.goto('http://127.0.0.1:5197',{waitUntil:'domcontentloaded',timeout:120000});
await page.locator('#start').waitFor();await page.evaluate(()=>document.fonts.ready);
await page.locator('#start').click();await page.locator('#play').click();
for(const id of ['image','cross','new']){
  const index=scenes.findIndex(s=>s.id===id);
  await page.locator('#timeline').evaluate((el,t)=>{el.value=t;el.dispatchEvent(new Event('input',{bubbles:true}));},sceneStarts[index]+5);
  await page.waitForTimeout(1800);await page.screenshot({path:`artifacts/scene-${id}.png`});console.log('Captured',id);
}
await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(600);await page.screenshot({path:'artifacts/film-mobile.png'});
await page.locator('#home').click();await page.waitForTimeout(1800);await page.screenshot({path:'artifacts/hero-mobile.png'});
await browser.close();console.log('Visual capture complete');
