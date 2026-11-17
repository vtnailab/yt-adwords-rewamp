import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { load } from 'cheerio';

// Import the public, user-supplied template's markup and styles. Runtime scripts,
// analytics, form endpoints, and Framer hosting dependencies are not imported.
const root = process.cwd();
const origin = 'https://growth-haus-wbs.framer.website';
const output = path.join(root, 'data/pages');
await fs.mkdir(output, { recursive: true });
await fs.mkdir(path.join(root, 'public/assets'), { recursive: true });
let motion = {};
try { motion = vm.runInNewContext('(' + await fs.readFile('reference/motion.json', 'utf8') + ')'); } catch {}
const queue = ['/'];
const pages = new Map();
const assets = new Map();
const localAsset = url => {
  const clean = url.replaceAll('&amp;', '&');
  if (!assets.has(clean)) {
    const parsed = new URL(clean);
    const ext = path.extname(parsed.pathname) || '.woff2';
    assets.set(clean, '/assets/' + crypto.createHash('sha256').update(clean).digest('hex').slice(0, 16) + ext);
  }
  return assets.get(clean);
};
const replaceAssets = text => text.replace(/https:\/\/(?:framerusercontent\.com|fonts\.gstatic\.com)\/[^\s"'<>\\)]+/g, localAsset);

while (queue.length) {
  const route = queue.shift();
  if (pages.has(route)) continue;
  const response = await fetch(origin + route);
  if (!response.ok) throw new Error(`${route}: ${response.status}`);
  const source = await response.text();
  const $ = load(source);
  const hydration = JSON.parse($('#main').attr('data-framer-hydrate-v2') || '{}');
  let appear = {};
  try { appear = JSON.parse($('#__framer__appearAnimationsContent').text()); } catch {}
  const title = $('title').text();
  const description = $('meta[name=description]').attr('content') || '';
  let css = $('head style').map((_, el) => $(el).text()).get().join('\n');
  const body = $('#main');
  body.find('script, #__framer-badge-container').remove();
  body.find('a').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    const url = new URL(href, origin + route);
    if (url.origin === origin) {
      const normalized = url.pathname.replace(/\/$/, '') || '/';
      $(el).attr('href', normalized + url.search + url.hash);
      if (!pages.has(normalized) && !queue.includes(normalized)) queue.push(normalized);
    }
    if (url.hostname === 'framer.link') $(el).closest('[class$="-container"]').remove();
  });
  body.find('form').removeAttr('action').removeAttr('method');
  body.find('input[value=""],textarea').removeAttr('value');
  body.find('[style]').each((_, el) => {
    const element = $(el);
    let style = element.attr('style') || '';
    const id = element.attr('data-framer-appear-id');
    if (/opacity:\s*0(?:\.001)?(?:;|$)/.test(style) && /transform:/.test(style)) {
      const originalTransform = style.match(/(?:^|;)\s*transform:([^;]+)/)?.[1] || 'none';
      const ref = motion[element.attr('class')];
      let target = ref?.style?.match(/transform:\s*([^;]+)/)?.[1];
      if (!target || /opacity:\s*0(?:;|$)/.test(ref?.style || '')) {
        target = originalTransform.replace(/translate[XY]?\([^)]*\)/g, '').replace(/scale\([^)]*\)/g, 'scale(1)').trim() || 'none';
      }
      element.attr('data-motion-from', originalTransform).attr('data-motion-to', target);
      style = style.replace(/opacity:[^;]+;?/g, '').replace(/transform:[^;]+;?/g, '') + ';opacity:1;transform:' + target;
      element.attr('style', style);
    }
    if (id && appear[id]) element.attr('data-entrance', JSON.stringify(appear[id]));
  });
  // CSS media queries keep each original SSR component variant; the two root
  // variant classes are switched by the small responsive controller.
  body.find('[data-layout-template],[data-framer-root]').each((_, el) => {
    const classes = ($(el).attr('class') || '').split(' ');
    const own = (hydration.breakpoints || []).filter(b => classes.includes('framer-' + b.hash));
    if (own.length) {
      const index = hydration.breakpoints.findIndex(b => b.hash === own[0].hash);
      const count = hydration.breakpoints.length / 2;
      $(el).attr('data-responsive-variants', JSON.stringify(hydration.breakpoints.slice(index < count ? 0 : count, index < count ? count : undefined)));
    }
  });
  body.find('img').attr('decoding', 'async');
  let html = body.html().replace(/<!--[^]*?-->/g, '');
  html = replaceAssets(html);
  css = replaceAssets(css);
  // Google font imports are redundant: the exact template @font-face files are local.
  html = html.replace(/@import url\([^)]*\);?/g, '');
  const entry = { route, title, description, html, css, breakpoints: hydration.breakpoints || [] };
  pages.set(route, entry);
  console.log('Imported', route);
  if (pages.size > 50) throw new Error('Unexpected crawl size');
}

let completed = 0;
const pending = [...assets];
await Promise.all(Array.from({length:8}, async () => {
  while (pending.length) {
    const [url, file] = pending.shift();
    const dest = path.join(root, 'public', file);
    try { await fs.access(dest); continue; } catch {}
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Asset ${response.status}: ${url}`);
    await fs.writeFile(dest, Buffer.from(await response.arrayBuffer()));
    if (++completed % 30 === 0) console.log('Downloaded', completed, '/', assets.size);
  }
}));
const manifest = [];
for (const [route, entry] of pages) {
  const key = route === '/' ? 'home' : route.slice(1).replaceAll('/', '__');
  await fs.writeFile(path.join(output, key + '.json'), JSON.stringify(entry));
  manifest.push({ route, key, title: entry.title });
}
await fs.writeFile('data/routes.json', JSON.stringify(manifest, null, 2));
await fs.writeFile('data/assets.json', JSON.stringify(Object.fromEntries(assets), null, 2));
console.log(`Finished: ${pages.size} pages, ${assets.size} local assets.`);
