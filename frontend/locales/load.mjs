// Source tree (personal edition, development servers, Node tests): every locale from one set of
// modules, merged once. The release build (frontend/build.mjs) replaces this module with one
// chunk per locale and keeps this merge as its single source of truth.
import {catalogs} from './catalogs.mjs';
import {extra} from './extra.mjs';
import {personalMessages} from './personal.mjs';
import {homeMessages} from './home.mjs';
const merged=Object.fromEntries(Object.keys(catalogs).map(code=>[code,{...catalogs[code],...extra[code],...personalMessages[code],...homeMessages[code]}]));
// Resolves at least the requested locales; here that is all of them.
export async function loadCatalogs(codes){return merged;}
