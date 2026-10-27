/** Resolve known app endpoints from the document, independently of emitted chunk paths. */
export function sameOriginUrl(path: `/${string}`, base: string | URL = location.href): URL {
  return new URL(path, base);
}
export const assetUrl = (name: string, base?: string | URL): URL => sameOriginUrl(`/assets/${name}`, base);
export const apiUrl = (path: string, base?: string | URL): URL => sameOriginUrl(`/api/${path.replace(/^\/+/, '')}`, base);
export const assemblyAssetUrl = (name: string, base?: string | URL): URL => sameOriginUrl(`/assemble/assets/${name}`, base);
