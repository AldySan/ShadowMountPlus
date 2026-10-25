// SPDX-License-Identifier: GPL-3.0-or-later
const { VitePlugin } = require('@electron-forge/plugin-vite');
const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

const LINUX_PACKAGES = {
  packageName: 'sm-toolbox',
  productName: 'SM+ Toolbox',
  maintainer: 'AldySan',
  homepage: 'https://github.com/drakmor/ShadowMountPlus',
  icon: 'assets/icon.png',
  categories: ['Utility'],
};

const config = {
  packagerConfig: {
    name: 'sm-toolbox',
    executableName: 'sm-toolbox',
    asar: true,
    icon: 'assets/icon',
    appCopyright: 'Copyright (C) ShadowMountPlus contributors',
  },
  rebuildConfig: {},
  makers: [
    { name: '@electron-forge/maker-zip', platforms: ['linux', 'win32'] },
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: { name: 'sm_toolbox' },
    },
    {
      name: '@electron-forge/maker-deb',
      platforms: ['linux'],
      config: { options: { ...LINUX_PACKAGES, section: 'utils' } },
    },
    {
      name: '@electron-forge/maker-rpm',
      platforms: ['linux'],
      config: { options: LINUX_PACKAGES },
    },
    { name: '@reforged/maker-appimage', platforms: ['linux'] },
  ],
  plugins: [
    new VitePlugin({
      build: [
        { entry: 'src/main/index.ts', target: 'main', config: 'vite.main.config.mts' },
        { entry: 'src/preload/preload.ts', target: 'preload', config: 'vite.preload.config.mts' },
      ],
      renderer: [{ name: 'main_window', config: 'vite.renderer.config.mts' }],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

module.exports = config;
