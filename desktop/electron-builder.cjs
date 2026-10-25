const { join } = require('node:path');
const { updateFeed, feedURL } = require('./dist/updates.js');
const version = process.env.DUCK_RELEASE_VERSION || require('./package.json').version;
if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-beta\.(0|[1-9]\d*))?$/.test(version)) throw Error('Release version must be X.Y.Z or X.Y.Z-beta.N');
const platform = process.argv.includes('--win') ? 'win32' : process.argv.includes('--mac') ? 'darwin' : process.platform;
const arch = process.env.DUCK_BUILD_ARCH || (process.argv.includes('--x64') ? 'x64' : process.argv.includes('--arm64') ? 'arm64' : process.arch);
const channel = version.includes('-beta.') ? 'beta' : 'stable';
const base = process.env.DUCK_UPDATE_BASE, exact = process.env.DUCK_UPDATE_URL, repository = process.env.DUCK_UPDATE_REPOSITORY;
if (repository && !/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(repository)) throw Error('Update repository must be owner/name');
const signing = Boolean(process.env.CSC_NAME && process.env.CSC_NAME !== '-' || process.env.CSC_LINK);
let publish = null;
if (base || exact || repository) {
  const url = exact || (repository ? `https://github.com/${repository}/releases/download/${channel}-${platform}-${arch}/` : updateFeed(base, channel, platform, arch));
  publish = { provider: 'generic', url: feedURL(url).href.replace(/\/+$/, '') + '/', channel: channel === 'stable' ? 'latest' : 'beta' };
}
if (platform === 'darwin' && publish && !signing) throw Error('Mac update builds require a distribution signing identity. Omit the update feed for an ad-hoc development package.');
const extraResources = [{ from: '../frontend', to: 'frontend', filter: ['**/*', '!**/*.py', '!**/__pycache__/**', '!**/.DS_Store'] }, { from: '../scripts/assembly-assets.json', to: 'assembly-assets.json' }, { from: '../LICENSE', to: 'LICENSE' }, { from: '../THIRD_PARTY_NOTICES.md', to: 'THIRD_PARTY_NOTICES.md' }];
if (process.env.DUCK_PACKAGE_WITHOUT_ASSETS !== '1') extraResources.push({ from: 'build/assets', to: 'assets', filter: ['**/*'] });
module.exports = {
  appId: 'com.letsduck.desktop', productName: '来做鸭', executableName: 'letsduck', asar: true,
  extraMetadata: { version },
  directories: { output: `release/${platform}-${arch}`, buildResources: 'build' },
  files: ['dist/**/*', 'package.json', '!**/*.map'], extraResources,
  icon: join(__dirname, 'build/icon.png'), artifactName: 'letsduck-${version}-${os}-${arch}.${ext}',
  publish, generateUpdatesFilesForAllChannels: false,
  mac: { target: ['dmg', 'zip'], category: 'public.app-category.graphics-design', identity: process.env.CSC_NAME || (process.env.CSC_LINK ? undefined : '-'), hardenedRuntime: signing, entitlements: 'entitlements.mac.plist', entitlementsInherit: 'entitlements.mac.plist', notarize: Boolean(signing && (process.env.APPLE_API_KEY || process.env.APPLE_ID)) },
  dmg: { sign: false },
  win: { target: ['nsis'] },
  nsis: { oneClick: true, perMachine: false, deleteAppDataOnUninstall: false },
};
