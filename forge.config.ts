import { MakerZIP } from '@electron-forge/maker-zip';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { VitePlugin } from '@electron-forge/plugin-vite';
import type { ForgeConfig } from '@electron-forge/shared-types';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import fs from 'fs/promises';
import path from 'path';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    name: 'APPU',
    executableName: 'APPU',
  },
  rebuildConfig: {},
  makers: [
    // macOS PKG install

    // Windows NSIS installer - try this syntax
    {
      name: '@felixrieseberg/electron-forge-maker-nsis',
      config: {
        async getAppBuilderConfig() {
          return {
            nsis: {
              artifactName: '${productName}-${version}-${arch}.${ext}',
              oneClick: false,
              allowElevation: true,
              allowToChangeInstallationDirectory: true,
              createDesktopShortcut: true,
              createStartMenuShortcut: true,
              shortcutName: 'APPU',
              uninstallDisplayName: 'APPU',
              deleteAppDataOnUninstall: false,
              warningsAsErrors: false,
              perMachine: false,
            },
          };
        },
      },
    },

    // Cross-platform ZIP packages
    new MakerZIP({}, ['darwin', 'win32', 'linux']),
  ],
  hooks: {
    postPackage: async (forgeConfig, packageResult) => {
      for (const outputPath of packageResult.outputPaths) {
        try {
          await fs.copyFile(
            path.resolve(__dirname, 'yt-dlp.exe'),
            path.join(outputPath, 'yt-dlp.exe'),
          );
        } catch (error) {
          console.error(`Failed to copy yt-dlp for ${outputPath}:`, error);
        }
      }
    },
  },
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
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

export default config;
