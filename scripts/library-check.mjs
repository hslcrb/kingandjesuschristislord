import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'msedge',headless:true,timeout:120000});const page=await browser.newPage({viewport:{width:1440,height:1000}});page.setDefaultTimeout(30000);
await page.goto('http://127.0.0.1:5197',{waitUntil:'domcontentloaded',timeout:120000});await page.locator('#start').click();await page.locator('#play').click();await page.locator('#chapters-open').click();await page.locator('[data-tab="books"]').click();await page.locator('#book-search').fill('요한계시록');
console.log('Before',await page.locator('.book-group details').evaluate(d=>({open:d.open,html:d.outerHTML,dialog:document.querySelector('#library').open})));
await page.locator('.book-group summary').click();
console.log('After',await page.locator('.book-group details').evaluate(d=>({open:d.open,dialog:document.querySelector('#library').open,button:d.querySelector('button').getBoundingClientRect().toJSON()})));
await page.screenshot({path:'artifacts/library-debug.png'});
await page.locator('.book-group [data-scene]').click({timeout:5000});console.log('Scene',await page.locator('body').getAttribute('data-scene'));await browser.close();
