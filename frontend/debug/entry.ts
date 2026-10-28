import {admitExperimental} from '../shared/experimental-entry.js';
if(await admitExperimental('debug'))await import('./manager.js');
