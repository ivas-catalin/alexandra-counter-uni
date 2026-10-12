import { cp, mkdir, rm } from 'node:fs/promises';

// dist/ is generated output. Clear it so obsolete artwork cannot be shipped.
await rm('dist', { recursive: true, force: true });
// No dependencies or compilation needed: only the public files go into dist/.
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'config.js', 'counter.js', 'bat-flight.js', '_headers']) {
  await cp(file, `dist/${file}`);
}
await cp('assets', 'dist/assets', { recursive: true, filter: source => !source.endsWith('.md') && !source.endsWith('.png') });
console.log('Ready for Cloudflare: public files are in dist/.');
