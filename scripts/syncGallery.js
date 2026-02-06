#!/usr/bin/env node
// Simple CLI to sync gallery to backend seed endpoint
// Usage: node scripts/syncGallery.js --token=ADMIN_TOKEN [--file=gallery.json] [--url=http://localhost:5000/api]

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  args.forEach(a => {
    const m = a.match(/^--([a-zA-Z0-9_-]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  });
  return out;
}

async function postJson(url, token, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

function parseGalleryHtml(html) {
  const dresses = [];
  const itemRegex = /<div\s+class="gallery-item"([^>]*)>([\s\S]*?)<\/div>/gi;
  let match;
  let id = 1;
  const allowedTypes = ['wedding','casual','evening','cocktail','party','prom'];
  const allowedSizes = ['xs','s','m','l'];

  function sanitizeType(t) {
    if (!t) return 'casual';
    const lt = String(t).toLowerCase().trim();
    return allowedTypes.includes(lt) ? lt : 'casual';
  }

  function sanitizeSizes(arr) {
    if (!arr) return ['s','m','l'];
    return arr.map(s=>String(s).toLowerCase().trim()).filter(s=>allowedSizes.includes(s));
  }
  while ((match = itemRegex.exec(html)) !== null) {
    const attrs = match[1];
    const block = match[2];

    const data = {};
    const dam = /data-(\w+)="([^"]*)"/gi;
    let dmatch;
    while ((dmatch = dam.exec(attrs)) !== null) {
      data[dmatch[1]] = dmatch[2];
    }

    const imgMatch = /<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"/i.exec(block);
    const priceMatch = /<p[^>]*class="price"[^>]*>\s*\$?([0-9]+)/i.exec(block);
    const nameFromP = /<p>([^<]+)<\/p>/i.exec(block);

    const image = imgMatch ? imgMatch[1].trim() : (data.image || '');
    const name = data.name || ((imgMatch && imgMatch[2]) ? imgMatch[2].trim() : (nameFromP ? nameFromP[1].trim() : `Dress ${id}`));
    const price = data.price ? parseInt(data.price, 10) : (priceMatch ? parseInt(priceMatch[1], 10) : 0);
      const rawType = data.type || (name.toLowerCase().includes('wedding') ? 'wedding' : 'casual');
      const type = sanitizeType(rawType);
      const sizes = sanitizeSizes(data.sizes ? data.sizes.split(',') : ['s','m','l']);
    const colour = data.colour || (image ? (image.toLowerCase().includes('white') ? 'white' : 'unknown') : 'unknown');

    dresses.push({ id: id++, name, price, type, sizes, colour, image });
  }
  return dresses;
}

(async function main(){
  const args = parseArgs();
  const token = args.token || process.env.ADMIN_TOKEN || process.env.ADMIN_PASSWORD;
  const apiBase = args.url || process.env.API_BASE || 'http://localhost:5000/api';
  const url = `${apiBase.replace(/\/+$/,'')}/dresses/seed`;
  const dir = args.dir || args.directory || process.env.FRONTEND_DIR || path.resolve(__dirname, '..');
  const filesArg = args.files;
  const watch = typeof args.watch !== 'undefined';

  if (!token) {
    console.error('Admin token not provided. Use --token=TOKEN or set ADMIN_TOKEN in env.');
    process.exit(2);
  }

  let dresses = null;

  // If a JSON file is provided, use it directly
  if (args.file) {
    const filePath = path.resolve(args.file);
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      process.exit(3);
    }
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.json') {
      const raw = fs.readFileSync(filePath, 'utf8');
      try { dresses = JSON.parse(raw); } catch (e) { console.error('Invalid JSON file'); process.exit(4); }
    } else if (ext === '.html' || ext === '.htm') {
      const raw = fs.readFileSync(filePath, 'utf8');
      dresses = parseGalleryHtml(raw);
    } else {
      console.error('Unsupported file type. Use .json or .html');
      process.exit(5);
    }
  } else {
    // Collect from multiple HTML files: either explicit files list or scan directory
    const htmlFiles = [];
    if (filesArg) {
      filesArg.split(',').forEach(f => htmlFiles.push(path.resolve(f.trim())));
    } else {
      const entries = fs.readdirSync(dir);
      entries.forEach(e => {
        const p = path.join(dir, e);
        if (fs.statSync(p).isFile() && /\.html?$/.test(e)) htmlFiles.push(p);
      });
    }

    if (htmlFiles.length === 0) {
      console.error('No HTML files found to parse in', dir);
      process.exit(6);
    }

    dresses = [];
    htmlFiles.forEach(filePath => {
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = parseGalleryHtml(raw);
        if (parsed && parsed.length) dresses.push(...parsed);
      } catch (err) {
        console.warn('Failed to parse', filePath, err.message);
      }
    });
  }

  if (!Array.isArray(dresses) || dresses.length === 0) {
    console.error('No dresses parsed from source. Aborting.');
    process.exit(7);
  }

  async function doPost() {
    console.log(`Posting ${dresses.length} dresses to ${url}`);
    try {
      const result = await postJson(url, token, { dresses });
      console.log('Response status:', result.status);
      console.log(result.body);
    } catch (err) {
      console.error('Request failed:', err.message);
      process.exit(10);
    }
  }

  await doPost();

  if (watch) {
    console.log('Watch mode enabled — watching HTML files for changes...');
    const watchFiles = [];
    if (filesArg) filesArg.split(',').forEach(f => watchFiles.push(path.resolve(f.trim())));
    else {
      const entries = fs.readdirSync(dir);
      entries.forEach(e => {
        const p = path.join(dir, e);
        if (fs.statSync(p).isFile() && /\.html?$/.test(e)) watchFiles.push(p);
      });
    }

    watchFiles.forEach(fp => {
      fs.watch(fp, { persistent: true }, async (ev, filename) => {
        if (!filename) return;
        console.log(`${filename} changed — reparsing and syncing...`);
        try {
          const raw = fs.readFileSync(fp, 'utf8');
          dresses = parseGalleryHtml(raw);
          if (dresses.length) await doPost();
        } catch (e) { console.warn('Watch sync failed:', e.message); }
      });
    });
  }
})();
