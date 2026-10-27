import type { ApiError, SiteConfig, Design, FilamentProduct } from '@letsduck/contracts';

const site: SiteConfig = { edition: 'server', publicUrl: '' };
// @ts-expect-error Server responses do not promise local hardware capabilities.
site.servoSetup;
const error: ApiError = { error: 'Invalid', code: 'request.invalid', params: {} };
// @ts-expect-error Error parameters remain structured values rather than untyped input.
error.params = 'invalid';
const product: FilamentProduct = { id: 'example', material: 'PLA', series: 'PLA', colorCode: null, productUrl: null };
// @ts-expect-error Unavailable metadata is explicit null; product identity remains text.
product.id = null;
const design: Design = { colors: {}, assignments: {}, finishes: {} };
// @ts-expect-error Finishes come from the shared schema's supported values.
design.finishes.p = 'gloss';
