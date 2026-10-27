// Browser and Node adapters use the same exact numeric wire implementation.
import { parseWireJson } from '@letsduck/domain';
export { parseWireJson as jsonParse, stringifyWireJson as jsonStringify } from '@letsduck/domain';

export async function parseResponseJson(response: Pick<Response, 'text'>): Promise<unknown> {
  return parseWireJson(await response.text());
}
