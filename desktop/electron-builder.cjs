const { join } = require('node:path');
const { updateFeed, feedURL } = require('./dist/updates.js');
const { version } = require('./package.json');
const platform = process.argv.includes('--win') ? 'win32' : process.argv.includes('--mac') ? 'darwin' : process.platform;
const arch = process.env.DUCK_BUILD_ARCH || (process.argv.includes('--x64') ? 'x64' : process.argv.includes('--arm64') ? 'arm64' : process.arch);
const channel = version.includes('-beta.') ? 'beta' : 'stable';
const base = process.env.DUCK_UPDATE_BASE, exact = process.env.DUCK_UPDATE_URL;
const signing = Boolean(process.env.CSC_NAME || process.env.CSC_LINK);
let publish = null;
if (base || exact) {
  publish = { provider: 'generic', url: exact ? feedURL(exact).href.replace(/\/+$/, '') + '/' : updateFeed(base, channel, platform, arch), channel: channel === 'stable' ? 'latest' : 'beta' };
}
const extraResources = [{ from: '../frontend', to: 'frontend', filter: ['**/*', '!**/*.py', '!**/__pycache__/**', '!**/.DS_Store'] }, { from: '../scripts/assembly-assets.json', to: 'assembly-assets.json' }, { from: '../LICENSE', to: 'LICENSE' }, { from: '../THIRD_PARTY_NOTICES.md', to: 'THIRD_PARTY_NOTICES.md' }];
if (process.env.DUCK_PACKAGE_WITHOUT_ASSETS !== '1') extraResources.push({ from: 'build/assets', to: 'assets', filter: ['**/*'] });
module.exports = {
  appId: 'com.letsduck.desktop', productName: '来做鸭', executableName: 'letsduck', asar: true,
  directories: { output: `release/${platform}-${arch}`, buildResources: 'build' },
  files: ['dist/**/*', 'package.json', '!**/*.map'], extraResources,
  icon: join(__dirname, 'build/icon.png'), artifactName: 'letsduck-${version}-${os}-${arch}.${ext}',
  publish, generateUpdatesFilesForAllChannels: false,
  mac: { target: ['dmg', 'zip'], category: 'public.app-category.graphics-design', identity: process.env.CSC_NAME || (process.env.CSC_LINK ? undefined : '-'), hardenedRuntime: signing, entitlements: 'entitlements.mac.plist', entitlementsInherit: 'entitlements.mac.plist', notarize: Boolean(signing && (process.env.APPLE_API_KEY || process.env.APPLE_ID)) },
  dmg: { sign: false },
  win: { target: ['nsis'] },
  nsis: { oneClick: true, perMachine: false, deleteAppDataOnUninstall: false },
};
