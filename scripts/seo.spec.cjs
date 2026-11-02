const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const origin = 'https://simulation.devcito.org/';
const html = readFileSync(join(root, 'src', 'index.html'), 'utf8');

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'))?.[1];
}

function meta(key, value) {
  return [...html.matchAll(/<meta\b[^>]*>/gi)]
    .map((match) => match[0])
    .find((tag) => attribute(tag, key) === value);
}

test('describes the Spanish-language application in the initial document', () => {
  assert.match(html, /<html\b[^>]*lang="es"/i);
  assert.match(html, /<title>World Simulation[^<]*<\/title>/i);
  assert.ok(attribute(meta('name', 'description') || '', 'content'));
  const canonical = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map((match) => match[0])
    .find((tag) => attribute(tag, 'rel') === 'canonical');
  assert.equal(attribute(canonical || '', 'href'), origin);
});

test('provides complete, consistent social sharing metadata', () => {
  for (const property of ['og:type', 'og:title', 'og:description', 'og:url', 'og:image']) {
    assert.ok(attribute(meta('property', property) || '', 'content'), property);
  }
  assert.equal(attribute(meta('property', 'og:url'), 'content'), origin);
  assert.equal(attribute(meta('name', 'twitter:card'), 'content'), 'summary_large_image');
  const image = attribute(meta('property', 'og:image'), 'content');
  assert.equal(image, `${origin}social-preview.png`);
  assert.equal(attribute(meta('name', 'twitter:image'), 'content'), image);
  const png = readFileSync(join(root, 'public', 'social-preview.png'));
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
});

test('publishes the canonical URL through structured data and discovery files', () => {
  const json = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  assert.ok(json);
  const data = JSON.parse(json[1]);
  assert.equal(data['@context'], 'https://schema.org');
  assert.equal(data['@type'], 'WebApplication');
  assert.equal(data.url, origin);

  const robots = readFileSync(join(root, 'public', 'robots.txt'), 'utf8');
  const sitemap = readFileSync(join(root, 'public', 'sitemap.xml'), 'utf8');
  const cname = readFileSync(join(root, 'public', 'CNAME'), 'utf8').trim();
  assert.match(robots, /User-agent:\s*\*/i);
  assert.ok(robots.includes(`Sitemap: ${origin}sitemap.xml`));
  assert.ok(sitemap.includes(`<loc>${origin}</loc>`));
  assert.equal(cname, 'simulation.devcito.org');
});
