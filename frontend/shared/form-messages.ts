import {t,onLocale} from './i18n.js';
type ValidityInput=HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement;
const reported=new WeakSet<ValidityInput>();
const validityInput=(input:unknown):input is ValidityInput=>input instanceof HTMLInputElement||input instanceof HTMLTextAreaElement||input instanceof HTMLSelectElement;
function translateValidity(input:ValidityInput){
  input.setCustomValidity('');
  if(input.validity.valueMissing)input.setCustomValidity(t('form.required'));
  else if(input.validity.tooShort)input.setCustomValidity(t('form.minlength',{count:input instanceof HTMLSelectElement?undefined:input.minLength}));
  else if(!input.validity.valid)input.setCustomValidity(t('form.invalid'));
}
document.addEventListener('invalid',event=>{
  const input=event.target;if(!validityInput(input))return;
  reported.add(input);translateValidity(input);
},true);
document.addEventListener('input',event=>{if(validityInput(event.target))event.target.setCustomValidity('');},true);
onLocale(()=>document.querySelectorAll('input,textarea,select').forEach(input=>{if(validityInput(input)&&reported.has(input))translateValidity(input);}));
