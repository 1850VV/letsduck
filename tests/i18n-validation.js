async page=>{
  await page.goto('http://127.0.0.1:8877/');await page.waitForFunction(()=>window.studioProto);
  if(await page.locator('#coach').isVisible())await page.locator('#coach-go').click();
  await page.locator('#language-trigger').click();await page.locator('[data-locale="fr"]').click();
  await page.locator('.profile-chip.guest').click();
  const message=await page.locator('#auth-name').evaluate(e=>{e.reportValidity();return e.validationMessage;});
  if(message!=='Ce champ est obligatoire.')throw Error('Native form validation did not follow app language: '+message);
  await page.locator('#auth-name').fill('白胚');
  await page.evaluate(async()=>{(await import('/shared/i18n.mjs')).setLocale('en');});
  if(await page.locator('#auth-name').inputValue()!=='白胚')throw Error('Locale switch lost a modal input');
  await page.locator('#auth-dialog [data-close]').click();return {passed:true};
}
