import {t,onLocale} from './i18n.mjs';
const reported=new WeakSet();
function translateValidity(input){
  input.setCustomValidity('');
  if(input.validity.valueMissing)input.setCustomValidity(t('form.required'));
  else if(input.validity.tooShort)input.setCustomValidity(t('form.minlength',{count:input.minLength}));
  else if(!input.validity.valid)input.setCustomValidity(t('form.invalid'));
}
document.addEventListener('invalid',event=>{
  const input=event.target;if(typeof input.setCustomValidity!=='function')return;
  reported.add(input);translateValidity(input);
},true);
document.addEventListener('input',event=>{if(typeof event.target.setCustomValidity==='function')event.target.setCustomValidity('');},true);
onLocale(()=>document.querySelectorAll('input,textarea,select').forEach(input=>{if(reported.has(input))translateValidity(input);}));
