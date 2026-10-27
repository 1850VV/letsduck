import type { ApiError, SiteConfig } from '@letsduck/contracts';

const site: SiteConfig = { edition: 'server', publicUrl: '' };
// @ts-expect-error Server responses do not promise local hardware capabilities.
site.servoSetup;
const error: ApiError = { error: 'Invalid', code: 'request.invalid', params: {} };
// @ts-expect-error Error parameters remain structured values rather than untyped input.
error.params = 'invalid';
