import {observationSettings,refreshObservationSettings} from './observation-controller.mjs';
import {bindTranslations,onLocale} from '../shared/i18n.mjs';
import {onPageActivity} from '../shared/personal-page.mjs';
const dialog=document.getElementById('observation-dialog'),quality=document.getElementById('render-quality'),light=document.getElementById('observation-lighting');
function sync(){const state=observationSettings.state;quality.value=state.quality;light.value=state.lighting;for(const key of ['quality','lighting'])for(const button of dialog.querySelectorAll('[data-'+key+']'))button.setAttribute('aria-pressed',String(button.dataset[key]===state[key]));}
document.getElementById('observation-open').addEventListener('click',()=>{refreshObservationSettings();sync();dialog.showModal();});
for(const button of dialog.querySelectorAll('[data-quality],[data-lighting]'))button.addEventListener('click',()=>{const key=button.dataset.quality?'quality':'lighting',input=key==='quality'?quality:light;input.value=button.dataset[key];input.dispatchEvent(new Event('change',{bubbles:true}));});
light.addEventListener('change',()=>observationSettings.set('lighting',light.value));
observationSettings.subscribe(sync);onPageActivity(active=>{if(active)refreshObservationSettings();});
function translate(){bindTranslations(dialog);bindTranslations(document.getElementById('observation-open').parentElement);}
translate();onLocale(translate);sync();
