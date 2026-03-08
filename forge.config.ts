import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    ...(process.platform === 'darwin' ? {
      extendInfo: {
        LSUIElement: true,
      },
    } : {}),
    icon: 'assets/icons/icon',
    extraResource: [
      'node_modules/sql.js/dist/sql-wasm.wasm',
      'assets/icons',
    ],
    afterCopy: [
      (buildPath, _electronVersion, _platform, _arch, callback) => {
        // Copy sql.js into the app's node_modules so require('sql.js') works
        const srcDir = path.join(__dirname, 'node_modules', 'sql.js');
        const destDir = path.join(buildPath, 'node_modules', 'sql.js');

        const copyRecursive = (src: string, dest: string) => {
          if (fs.statSync(src).isDirectory()) {
            fs.mkdirSync(dest, { recursive: true });
            for (const entry of fs.readdirSync(src)) {
              // Skip wasm files (already in extraResource) and unnecessary files
              if (entry.endsWith('.wasm')) continue;
              copyRecursive(path.join(src, entry), path.join(dest, entry));
            }
          } else {
            fs.copyFileSync(src, dest);
          }
        };

        try {
          copyRecursive(srcDir, destDir);
          callback();
        } catch (err) {
          callback(err as Error);
        }
      },
    ],
  },
  hooks: {
    postPackage: async (_config, options) => {
      if (options.platform !== 'darwin') return;
      // Ad-hoc sign the app so macOS allows it to run and login items work
      const appPath = path.join(options.outputPaths[0], 'KronoBar.app');
      console.log(`[KronoBar] Ad-hoc signing ${appPath}...`);
      execSync(`codesign --deep --force --sign - "${appPath}"`, { stdio: 'inherit' });
      console.log('[KronoBar] Signing complete.');
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerZIP({}, ['darwin', 'win32']),
    new MakerSquirrel({
      name: 'KronoBar',
      setupIcon: 'assets/icons/icon.ico',
    }),
  ],
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
      [FuseV1Options.OnlyLoadAppFromAsar]: false,
    }),
  ],
};

export default config;
