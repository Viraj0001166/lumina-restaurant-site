/* Build script to create a minified/obfuscated production bundle in dist/ */
import fs from 'fs-extra';
import { globby } from 'globby';
import { minify as minifyHtml } from 'html-minifier-terser';
import CleanCSS from 'clean-css';
import JavaScriptObfuscator from 'javascript-obfuscator';
import path from 'node:path';

const root = process.cwd();
const dist = `${root}/dist`;

async function copyStatic() {
  // Copy everything first, then transform specific file types
  await fs.emptyDir(dist);
  // Only copy relevant assets for site (exclude dev files)
  const patterns = [
    'index.html',
    'assets/**/*.*',
    'robots.txt',
    '!node_modules/**',
    '!dist/**',
    '!tools/**',
    '!**/*.map'
  ];
  const files = await globby(patterns, { dot: true, onlyFiles: true });
  await Promise.all(files.map(async p => {
    const src = path.join(root, p);
    const dest = path.join(dist, p);
    await fs.ensureDir(path.dirname(dest));
    await fs.copyFile(src, dest);
  }));
}

async function minifyHTMLFiles() {
  const files = await globby(['dist/**/*.html']);
  for (const file of files) {
    const html = await fs.readFile(file, 'utf8');
    const min = await minifyHtml(html, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeEmptyAttributes: true,
      minifyCSS: true,
      minifyJS: true,
    });
    await fs.writeFile(file, min, 'utf8');
  }
}

async function minifyCSSFiles() {
  const files = await globby(['dist/**/*.css']);
  const cleaner = new CleanCSS({ level: 2 });
  for (const file of files) {
    const css = await fs.readFile(file, 'utf8');
    const out = cleaner.minify(css);
    if (out.errors && out.errors.length) {
      console.warn('CSS minify error in', file, out.errors);
      continue;
    }
    await fs.writeFile(file, out.styles, 'utf8');
  }
}

async function obfuscateJSFiles() {
  const files = await globby(['dist/**/*.js', '!dist/netlify/**']);
  for (const file of files) {
    const js = await fs.readFile(file, 'utf8');
    const res = JavaScriptObfuscator.obfuscate(js, {
      compact: true,
      controlFlowFlattening: false,
      deadCodeInjection: false,
      stringArray: true,
      rotateStringArray: true,
      stringArrayThreshold: 0.75,
      simplify: true,
      target: 'browser',
      selfDefending: true,
    });
    await fs.writeFile(file, res.getObfuscatedCode(), 'utf8');
  }
}

async function run() {
  await copyStatic();
  await minifyCSSFiles();
  await obfuscateJSFiles();
  await minifyHTMLFiles();
  console.log('Build completed: dist/ ready');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
