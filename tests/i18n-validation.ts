import * as browserChecks from './browser/checks.js';
import type { Page } from 'playwright';
export default async (page: Page) =>{
 await browserChecks.preparePage(page);
  await browserChecks.preparePage(page);await page.goto(browserChecks.paintUrl(browserChecks.browserUrl()));await page.waitForFunction(()=>window.studioProto);await browserChecks.installRuntime(page);
  await page.evaluate(async()=>{const token=localStorage.getItem('dd-token');if(token)await fetch('/api/auth/logout',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:'{}'});localStorage.removeItem('dd-token');});
  await page.reload();await page.waitForFunction(()=>window.studioProto);await browserChecks.installRuntime(page);
  if(await page.locator('#coach').isVisible())await page.locator('#coach-go').click();
  await page.locator('#language-trigger').click();await page.locator('[data-locale="fr"]').click();
  await page.locator('.profile-chip.guest').click();
  const message=await page.locator('#auth-name').evaluate(e=>{if(!(e instanceof HTMLInputElement))throw Error('Expected input');e.reportValidity();return e.validationMessage;});
  if(message!=='Ce champ est obligatoire.')throw Error('Native form validation did not follow app language: '+message);
  await page.locator('#auth-name').fill('白胚');
  await browserChecks.dispatchLocale(page,'en');
  if(await page.locator('#auth-name').inputValue()!=='白胚')throw Error('Locale switch lost a modal input');
  await page.locator('#auth-dialog [data-close]').click();return {passed:true};
}
