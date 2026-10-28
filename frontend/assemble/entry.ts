import {admitExperimental} from '../shared/experimental-entry.js';
if(await admitExperimental('assemble')){
 await import('./ui-elements.js');
 await import('./page.js');
 await import('./prototype-v3.js');
}
