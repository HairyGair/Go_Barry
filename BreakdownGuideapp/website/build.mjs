/**
 * Builds the gobarry.co.uk marketing site into website/dist.
 *
 *   node website/build.mjs
 *
 * Plain static HTML (no framework): every page's content is in the HTML that
 * search engines fetch, and pages load fast on any connection.
 */

import { mkdirSync, writeFileSync, readFileSync, cpSync, rmSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, breadcrumb, faqSchema, SITE } from './src/layout.mjs';
import { PAGES, NOT_FOUND } from './src/pages.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

cpSync(join(root, 'public'), dist, { recursive: true });
const css = readFileSync(join(root, 'src/site.css'), 'utf8');
writeFileSync(join(dist, 'site.css'), css);
cpSync(join(root, 'src/site.js'), join(dist, 'site.js'));
cpSync(join(root, 'src/htaccess'), join(dist, '.htaccess'));
const version = createHash('sha1').update(css).digest('hex').slice(0, 8);

const today = new Date().toISOString().slice(0, 10);
const crumbName = (p) => p.title.split(' | ')[0];

for (const page of PAGES) {
  const body = typeof page.body === 'function' ? page.body(page) : page.body;
  const base = typeof page.schema === 'function' ? page.schema(page) : page.schema;
  const schema = [].concat(base || []);
  if (page.path !== '/') {
    schema.push(breadcrumb([{ name: 'Home', path: '/' }, { name: crumbName(page), path: page.path }]));
    if (page.faqs) schema.push(faqSchema(page.faqs));
  }
  const html = render({ ...page, body, schema, version });
  const dir = join(dist, page.path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
}

writeFileSync(join(dist, '404.html'), render({ ...NOT_FOUND, version }));

const urls = PAGES.map(p => `  <url>
    <loc>${SITE.origin}${p.path}</loc>
    <lastmod>${today}</lastmod>
    <priority>${p.priority || (p.path === '/' ? '1.0' : '0.8')}</priority>
  </url>`).join('\n');
writeFileSync(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`);

writeFileSync(join(dist, 'robots.txt'), `User-agent: *
Allow: /

Sitemap: ${SITE.origin}/sitemap.xml
`);

const count = readdirSync(dist, { recursive: true }).filter(f => String(f).endsWith('.html')).length;
console.log(`Built ${count} pages into ${dist} (css ${version})`);
