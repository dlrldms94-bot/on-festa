#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const I18N_PATH = path.join(ROOT, 'js', 'i18n.js');
const ZH_LEAVES_PATH = path.join(__dirname, 'zh-leaves.json');
const JA_LEAVES_PATH = path.join(__dirname, 'ja-leaves.json');
const OUT_PATH = path.join(ROOT, 'js', 'i18n-extra.js');

function extractEnObject(source) {
  const marker = 'en: {';
  const start = source.indexOf(marker);
  if (start === -1) throw new Error('Could not find en: { in js/i18n.js');

  let i = start + marker.length - 1;
  let depth = 0;
  let inString = false;
  let stringQuote = '';
  let escaped = false;

  for (; i < source.length; i++) {
    const ch = source[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === stringQuote) inString = false;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      stringQuote = ch;
      continue;
    }

    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        const block = source.slice(start + 'en: '.length, i + 1);
        // eslint-disable-next-line no-new-func
        return Function(`"use strict"; return (${block});`)();
      }
    }
  }

  throw new Error('Unbalanced braces while parsing en object');
}

function collectLeaves(obj, prefix, out) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return;
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    const p = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'string') out.push({ path: p, v: val });
    else if (val && typeof val === 'object') collectLeaves(val, p, out);
  }
}

function setByPath(root, dotPath, value) {
  const parts = dotPath.split('.');
  let cur = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!cur[p] || typeof cur[p] !== 'object') cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

function leavesToObject(leaves) {
  const obj = {};
  for (const { path: dotPath, v } of leaves) setByPath(obj, dotPath, v);
  return obj;
}

function readLeaves(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function verifyLeaves(name, leaves, enPaths) {
  const paths = leaves.map((x) => x.path);
  const set = new Set(paths);
  if (paths.length !== set.size) {
    throw new Error(`${name}: duplicate paths`);
  }
  if (paths.length !== enPaths.length) {
    throw new Error(`${name}: expected ${enPaths.length} leaves, got ${paths.length}`);
  }
  for (const p of enPaths) {
    if (!set.has(p)) throw new Error(`${name}: missing path ${p}`);
  }
}

function main() {
  const i18nSource = fs.readFileSync(I18N_PATH, 'utf8');
  const en = extractEnObject(i18nSource);
  const enLeaves = [];
  collectLeaves(en, '', enLeaves);
  enLeaves.sort((a, b) => a.path.localeCompare(b.path));
  const enPaths = enLeaves.map((x) => x.path);

  const zhLeaves = readLeaves(ZH_LEAVES_PATH);
  const jaLeaves = readLeaves(JA_LEAVES_PATH);

  zhLeaves.sort((a, b) => a.path.localeCompare(b.path));
  jaLeaves.sort((a, b) => a.path.localeCompare(b.path));

  verifyLeaves('zh-leaves.json', zhLeaves, enPaths);
  verifyLeaves('ja-leaves.json', jaLeaves, enPaths);

  const zh = leavesToObject(zhLeaves);
  const ja = leavesToObject(jaLeaves);

  const body = `(function (global) {
  global.ONFESTA_LOCALE_ZH = ${JSON.stringify(zh, null, 2)};
  global.ONFESTA_LOCALE_JA = ${JSON.stringify(ja, null, 2)};
})(typeof window !== 'undefined' ? window : globalThis);
`;

  fs.writeFileSync(OUT_PATH, body, 'utf8');
  console.log(`Wrote ${OUT_PATH}`);
  console.log(`Verified ${enPaths.length} leaves (en), zh, ja`);
}

main();
