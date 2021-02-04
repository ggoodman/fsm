// @ts-check
const Esbuild = require('esbuild');
const Rollup = require('rollup');
const RollupPluginDts = require('rollup-plugin-dts').default;
const ChildProcess = require('child_process');
const Path = require('path');
const Util = require('util');
const Package = require('../package.json');

async function main() {
  await Esbuild.build({
    absWorkingDir: Path.dirname(__dirname),
    bundle: true,
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    entryPoints: [Path.resolve(__dirname, '../src/index.ts')],
    external: Object.keys(Package.dependencies),
    format: 'cjs',
    mainFields: ['module', 'main'],
    outfile: Path.resolve(__dirname, '../', Package.main),
    platform: 'neutral',
    target: 'node12.16',
    treeShaking: true,
    write: true,
  });

  await Esbuild.build({
    absWorkingDir: Path.dirname(__dirname),
    bundle: true,
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    entryPoints: [Path.resolve(__dirname, '../src/index.ts')],
    external: Object.keys(Package.dependencies),
    format: 'esm',
    mainFields: ['module', 'main'],
    outfile: Path.resolve(__dirname, '../', Package.module),
    platform: 'neutral',
    target: 'node12.16',
    treeShaking: true,
    write: true,
  });

  await Util.promisify(ChildProcess.execFile)(Path.resolve(__dirname, '../node_modules/.bin/tsc'), [
    '--build',
    '--force',
  ]);

  const build = await Rollup.rollup({
    input: Path.resolve(__dirname, '../dist/.types/index.d.ts'),
    plugins: [RollupPluginDts()],
  });

  await build.write({
    file: Path.resolve(__dirname, '../', Package.types),
    format: 'esm',
  });
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
