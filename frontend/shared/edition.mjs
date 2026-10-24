// Fail closed if configuration is unavailable: do not guess the storage mode.
let configuration;
export function loadSite() {
  return configuration ||= fetch('/api/site').then(async response => {
    if (!response.ok) throw Error('Site configuration unavailable');
    const data = await response.json();
    if (!['personal', 'server'].includes(data.edition)) throw Error('Invalid deployment edition');
    return data;
  });
}
export const loadEdition = () => loadSite().then(data => data.edition);
